"""Flask backend for the LeafLens website.

Serves the built React frontend and exposes the trained MobileNetV2 model
(plant_pathology_mobilenetv2.keras) through a small JSON API.

Preprocessing and decoding follow the project code:
  * image -> RGB -> 224 x 224 (antialiased, as in train.py), raw 0-255 float values
    (the saved model applies MobileNetV2's `x / 127.5 - 1` internally)
  * sigmoid probabilities, threshold 0.5, top-1 fallback when no class passes
"""
import io
import json
import os
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request, send_from_directory
from PIL import Image, UnidentifiedImageError

from disease_info import DISEASE_INFO

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.environ.get("MODEL_PATH", BASE_DIR / "model" / "plant_pathology_mobilenetv2.keras"))
METRICS_PATH = BASE_DIR / "model" / "metrics.json"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

IMG_SIZE = 224
THRESHOLD = 0.5
# Output order of the saved model, as defined in train.py (LABELS), which produced it.
# Note: the notebook lists powdery_mildew before complex; the saved model does not.
LABELS = ["healthy", "scab", "frog_eye_leaf_spot", "rust", "complex", "powdery_mildew"]
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024

print(f"Loading model from {MODEL_PATH} ...")
model = tf.keras.models.load_model(MODEL_PATH)
model(np.zeros((1, IMG_SIZE, IMG_SIZE, 3), np.float32), training=False)  # warm-up
print("Model ready.")

metrics = json.loads(METRICS_PATH.read_text()) if METRICS_PATH.exists() else None


def load_resize(file_bytes):
    """Same steps as load_image() in train.py, which produced the saved model:
    decode to RGB (reduced-scale JPEG decoding), antialiased resize to 224 x 224, round to uint8."""
    with Image.open(io.BytesIO(file_bytes)) as im:  # validates the file and gives its size
        im.verify()
        fmt, (w, h) = im.format, im.size
    if fmt == "JPEG":
        # train.py decodes the ~4000x2672 dataset photos with ratio=4; use the same ratio for
        # large uploads, but never shrink small uploads below ~2x the model input.
        ratio = next(r for r in (4, 2, 1) if min(w, h) / r >= IMG_SIZE * 2 or r == 1)
        image = tf.io.decode_jpeg(file_bytes, channels=3, ratio=ratio)
    else:
        image = tf.io.decode_image(file_bytes, channels=3, expand_animations=False)
    image = tf.image.resize(image, [IMG_SIZE, IMG_SIZE], antialias=True)
    image = tf.cast(tf.clip_by_value(tf.round(image), 0, 255), tf.uint8)
    return tf.cast(image, tf.float32).numpy()


def decode_predictions(probs, threshold=THRESHOLD):
    """Binary labels: prob > threshold; if no class exceeds it, assign the most probable class."""
    pred = probs > threshold
    if not pred.any():
        pred[int(probs.argmax())] = True
    return pred


@app.post("/api/predict")
def predict():
    file = request.files.get("image")
    if file is None or not file.filename:
        return jsonify(error="No image uploaded. Send the file in the 'image' field."), 400
    if Path(file.filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        return jsonify(error="Unsupported file type. Please upload a JPG, JPEG or PNG image."), 400
    try:
        x = load_resize(file.read())
    except (UnidentifiedImageError, OSError, tf.errors.InvalidArgumentError):
        return jsonify(error="The file could not be read as an image."), 400

    probs = np.asarray(model(x[None], training=False))[0]
    confident = bool((probs > THRESHOLD).any())
    pred = decode_predictions(probs)
    labels = sorted((label for label, p in zip(LABELS, pred) if p), key=lambda label: -probs[LABELS.index(label)])
    entries = [{"label": label, "probability": float(probs[LABELS.index(label)]), **DISEASE_INFO[label]}
               for label in labels]

    return jsonify(
        # Only classes above the threshold are reported as detected; otherwise the top-1
        # fallback class is returned separately as an unconfirmed closest match.
        detected=entries if confident else [],
        closest_match=None if confident else entries[0],
        probabilities=sorted(({"label": label, "name": DISEASE_INFO[label]["name"], "probability": float(p)}
                              for label, p in zip(LABELS, probs)), key=lambda d: -d["probability"]),
        threshold=THRESHOLD,
        fallback_used=not confident,
        is_healthy=confident and labels == ["healthy"],
    )


@app.get("/api/model-info")
def model_info():
    return jsonify(labels=LABELS, image_size=IMG_SIZE, threshold=THRESHOLD,
                   model_file=MODEL_PATH.name, metrics=metrics)


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.errorhandler(413)
def too_large(_):
    return jsonify(error="Image is too large (max 15 MB)."), 413


@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def frontend(path):
    if not FRONTEND_DIST.exists():
        return ("Frontend not built. Run `npm install && npm run build` in website/frontend.", 503)
    if path and (FRONTEND_DIST / path).is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=False)
