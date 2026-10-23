"""Evaluate the website's model on a folder of labelled leaf images (one sub-folder per class).

Images go through exactly the same preprocessing and decoding as the website backend.
Default mapping is for the PlantVillage apple folders; Apple "Black rot" leaves show
frog eye leaf spot (same fungus, Botryosphaeria obtusa).

Usage:
  python evaluate_folder.py DATA_DIR [--map "FolderName=model_label,..."] [--out results.csv]
"""
import argparse
import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report

import app as backend  # loads the same model file as the website

DEFAULT_MAP = {
    "Apple___Apple_scab": "scab",
    "Apple___Black_rot": "frog_eye_leaf_spot",
    "Apple___Cedar_apple_rust": "rust",
    "Apple___healthy": "healthy",
}
EXTS = {".jpg", ".jpeg", ".png"}

parser = argparse.ArgumentParser()
parser.add_argument("data_dir")
parser.add_argument("--map", help="FolderName=model_label pairs, comma-separated")
parser.add_argument("--out", default="folder_eval_predictions.csv")
args = parser.parse_args()

mapping = dict(DEFAULT_MAP)
if args.map:
    mapping = dict(pair.split("=", 1) for pair in args.map.split(","))
bad = set(mapping.values()) - set(backend.LABELS)
if bad:
    sys.exit(f"Unknown model labels in mapping: {sorted(bad)}; valid: {backend.LABELS}")

rows = []
for folder, label in mapping.items():
    files = sorted(p for p in (Path(args.data_dir) / folder).glob("*") if p.suffix.lower() in EXTS)
    print(f"{folder:<28s} -> {label:<20s} {len(files)} images")
    for p in files:
        x = backend.load_resize(p.read_bytes())
        probs = np.asarray(backend.model(x[None], training=False))[0]
        rows.append({"image": str(p), "true": label, **{f"prob_{l}": float(v) for l, v in zip(backend.LABELS, probs)}})
if not rows:
    sys.exit("No images found.")

df = pd.DataFrame(rows)
P = df[[f"prob_{l}" for l in backend.LABELS]].to_numpy()
df["top1"] = [backend.LABELS[i] for i in P.argmax(1)]
df["confident"] = P.max(1) > backend.THRESHOLD
df.to_csv(args.out, index=False)

present = [l for l in backend.LABELS if l in set(df["true"])]
print(f"\nImages: {len(df)}   top-1 accuracy: {(df.top1 == df.true).mean():.3f}")
print(f"Confident (max score > {backend.THRESHOLD}): {df.confident.mean():.3f}   "
      f"accuracy when confident: {(df.top1 == df.true)[df.confident].mean():.3f}")
print("\nTop-1 per-class report (labels the folders contain):")
print(classification_report(df.true, df.top1, labels=present, digits=3, zero_division=0))
cm = pd.crosstab(df.true, df.top1).reindex(index=present, columns=backend.LABELS, fill_value=0)
print("Confusion matrix (rows = true, columns = top-1 predicted):")
print(cm.to_string())
print("\nMedian score of the true class:")
for l in present:
    print(f"  {l:<20s} {df.loc[df.true == l, f'prob_{l}'].median():.3f}")
print(f"\nPer-image results written to {args.out}")
