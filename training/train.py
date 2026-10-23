import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score

LABELS = ["healthy", "scab", "frog_eye_leaf_spot", "rust", "complex", "powdery_mildew"]

def encode_labels(label_string):
    found = set(str(label_string).split())
    unknown = found - set(LABELS)
    if unknown:
        raise ValueError(f"Unknown label(s) {sorted(unknown)} in '{label_string}'")
    return [1.0 if label in found else 0.0 for label in LABELS]

def load_image(path, label, image_size, decode_ratio):
    raw = tf.io.read_file(path)
    # Competition images are ~4000x2672; decoding at reduced scale is much faster.
    image = tf.io.decode_jpeg(raw, channels=3, ratio=decode_ratio)
    image = tf.image.resize(image, [image_size, image_size], antialias=True)
    # Keep uint8 so the cached dataset fits in memory.
    image = tf.cast(tf.clip_by_value(tf.round(image), 0, 255), tf.uint8)
    return image, label

def make_dataset(paths, labels, image_size, batch_size, decode_ratio,
                 training=False, cache=True):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(
        lambda p, y: load_image(p, y, image_size, decode_ratio),
        num_parallel_calls=tf.data.AUTOTUNE,
    )
    if cache:
        ds = ds.cache()
    if training:
        ds = ds.shuffle(min(len(paths), 4096), reshuffle_each_iteration=True)
    ds = ds.map(lambda x, y: (tf.cast(x, tf.float32), y),
                num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        augment = tf.keras.Sequential([
            tf.keras.layers.RandomFlip("horizontal_and_vertical"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.1),
        ])
        ds = ds.map(lambda x, y: (augment(x, training=True), y),
                    num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="data/plant-pathology-2021-fgvc8")
    parser.add_argument("--output_dir", default="outputs")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--image_size", type=int, default=224)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--decode_ratio", type=int, default=4, choices=[1, 2, 4, 8])
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--weights", default="imagenet",
                        help="'imagenet' (needs internet), 'none', or a path to an .h5 file.")
    parser.add_argument("--no_cache", action="store_true",
                        help="Do not cache decoded images in memory.")
    parser.add_argument("--limit", type=int, default=0,
                        help="Use only the first N images (quick smoke test).")
    args = parser.parse_args()

    print(f"TensorFlow {tf.__version__}; GPUs: {tf.config.list_physical_devices('GPU')}")

    data_dir = Path(args.data_dir)
    csv_path = data_dir / "train.csv"
    image_dir = data_dir / "train_images"
    if not csv_path.exists() or not image_dir.exists():
        raise FileNotFoundError(
            f"Could not find {csv_path} and/or {image_dir}. "
            "Download and extract the Kaggle dataset first."
        )

    df = pd.read_csv(csv_path)
    required = {"image", "labels"}
    if not required.issubset(df.columns):
        raise ValueError(f"train.csv must contain columns: {sorted(required)}")
    if args.limit:
        df = df.iloc[:args.limit].reset_index(drop=True)
    print(f"Loaded {len(df)} rows from {csv_path}")

    df["path"] = df["image"].map(lambda name: str(image_dir / name))
    missing = df.loc[~df["path"].map(lambda p: Path(p).is_file()), "path"]
    if len(missing):
        raise FileNotFoundError(f"{len(missing)} image files are missing; check extraction.")

    y = np.asarray([encode_labels(s) for s in df["labels"]], dtype=np.float32)
    print("Images per label:", dict(zip(LABELS, y.sum(axis=0).astype(int).tolist())))
    train_idx, val_idx = train_test_split(
        np.arange(len(df)), test_size=0.15, random_state=42
    )
    cache = not args.no_cache
    train_ds = make_dataset(
        df["path"].iloc[train_idx].tolist(), y[train_idx],
        args.image_size, args.batch_size, args.decode_ratio,
        training=True, cache=cache,
    )
    val_ds = make_dataset(
        df["path"].iloc[val_idx].tolist(), y[val_idx],
        args.image_size, args.batch_size, args.decode_ratio, cache=cache,
    )

    backbone = tf.keras.applications.MobileNetV2(
        include_top=False,
        weights=None if args.weights.lower() == "none" else args.weights,
        input_shape=(args.image_size, args.image_size, 3)
    )
    backbone.trainable = False
    inputs = tf.keras.Input(shape=(args.image_size, args.image_size, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = backbone(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(len(LABELS), activation="sigmoid")(x)
    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="binary_accuracy"),
            tf.keras.metrics.AUC(multi_label=True, name="auc"),
        ]
    )

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=2, restore_best_weights=True
        ),
        tf.keras.callbacks.CSVLogger(str(output_dir / "training_history.csv")),
    ]
    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs,
                        callbacks=callbacks)

    # val_ds is not shuffled, so prediction order matches val_idx.
    val_probs = model.predict(val_ds, verbose=1)
    val_true = y[val_idx].astype(int)
    val_pred = (val_probs >= args.threshold).astype(int)
    # Every image has at least one label: fall back to the top class if none passes.
    val_pred_fallback = val_pred.copy()
    empty = val_pred_fallback.sum(axis=1) == 0
    val_pred_fallback[empty, val_probs[empty].argmax(axis=1)] = 1

    def f1s(pred):
        return {
            "macro": float(f1_score(val_true, pred, average="macro", zero_division=0)),
            "micro": float(f1_score(val_true, pred, average="micro", zero_division=0)),
            "samples": float(f1_score(val_true, pred, average="samples", zero_division=0)),
        }

    per_class = f1_score(val_true, val_pred_fallback, average=None, zero_division=0)
    val_eval = model.evaluate(val_ds, verbose=0, return_dict=True)
    metrics = {
        "num_train_images": int(len(train_idx)),
        "num_val_images": int(len(val_idx)),
        "epochs_run": len(history.history["loss"]),
        "threshold": args.threshold,
        "image_size": args.image_size,
        "val_loss": float(val_eval["loss"]),
        "val_binary_accuracy": float(val_eval["binary_accuracy"]),
        "val_auc": float(val_eval["auc"]),
        "f1_threshold_only": f1s(val_pred),
        "f1_with_top1_fallback": f1s(val_pred_fallback),
        "exact_match_accuracy": float((val_pred_fallback == val_true).all(axis=1).mean()),
        "per_class_f1": dict(zip(LABELS, map(float, per_class))),
    }
    print(f"Validation macro F1 (threshold {args.threshold}): "
          f"{metrics['f1_threshold_only']['macro']:.4f}")
    print(f"Validation macro F1 (with top-1 fallback): "
          f"{metrics['f1_with_top1_fallback']['macro']:.4f}")
    print(classification_report(val_true, val_pred_fallback, target_names=LABELS,
                                zero_division=0))

    model.save(output_dir / "plant_pathology_mobilenetv2.keras")

    def to_label_string(row):
        return " ".join(label for label, v in zip(LABELS, row) if v)

    val_df = pd.DataFrame({
        "image": df["image"].iloc[val_idx].to_numpy(),
        "true_labels": df["labels"].iloc[val_idx].to_numpy(),
        "pred_labels": [to_label_string(r) for r in val_pred_fallback],
    })
    for i, label in enumerate(LABELS):
        val_df[f"true_{label}"] = val_true[:, i]
    for i, label in enumerate(LABELS):
        val_df[f"prob_{label}"] = val_probs[:, i]
    val_df.to_csv(output_dir / "validation_predictions.csv", index=False)
    with open(output_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved model, validation predictions and metrics to {output_dir.resolve()}")

if __name__ == "__main__":
    main()
