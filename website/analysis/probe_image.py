"""Sensitivity probe: how the existing model's scores for one image change under crops/flips/rotations,
compared with the scores it gives real frog-eye validation images. Diagnostic only.
Usage: python probe_image.py path/to/image.jpg
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
LABELS = ["healthy", "scab", "frog_eye_leaf_spot", "rust", "complex", "powdery_mildew"]
model = tf.keras.models.load_model(Path(__file__).resolve().parents[1] / "backend/model/plant_pathology_mobilenetv2.keras")


def scores(im):
    x = tf.image.resize(np.asarray(im.convert("RGB"), np.float32), [224, 224], antialias=True)
    x = tf.cast(tf.cast(tf.clip_by_value(tf.round(x), 0, 255), tf.uint8), tf.float32)
    return np.asarray(model(x[None], training=False))[0]


img = Image.open(sys.argv[1]).convert("RGB")
w, h = img.size
variants = {
    "original": img,
    "crop: main leaf only": img.crop((0, int(h * .05), int(w * .72), h)),
    "crop: centre 60%": img.crop((int(w * .2), int(h * .2), int(w * .8), int(h * .8))),
    "pad to 3:2 (dataset aspect)": Image.new("RGB", (int(w * 1.5), h), (128, 120, 100)),
    "horizontal flip": img.transpose(Image.Transpose.FLIP_LEFT_RIGHT),
    "rotate 90": img.rotate(90, expand=True),
    "rotate 180": img.rotate(180),
}
variants["pad to 3:2 (dataset aspect)"].paste(img, (int(w * .25), 0))

rows = {k: scores(v) for k, v in variants.items()}
table = pd.DataFrame(rows, index=LABELS).T.round(3)
table["top-1"] = table[LABELS].idxmax(axis=1)
pd.set_option("display.width", 160)
print(table.to_string())

val_csv = Path.home() / "Downloads/outputs/validation_predictions.csv"  # written by training/train.py
if val_csv.exists():
    val = pd.read_csv(val_csv).fillna("")
    fe = val[val.true_labels == "frog_eye_leaf_spot"]
    q = fe.prob_frog_eye_leaf_spot.quantile([.05, .25, .5]).round(3).to_dict()
    print(f"\nprob_frog_eye on {len(fe)} real frog-eye validation images: 5th pct {q[.05]}, 25th {q[.25]}, median {q[.5]}")
    print(f"max class score, all validation images: median {val[[f'prob_{l}' for l in LABELS]].max(axis=1).median():.3f}")
