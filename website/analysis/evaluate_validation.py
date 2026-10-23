"""Recompute validation metrics of the existing model from outputs/validation_predictions.csv.

That CSV was written by train.py with the saved model's own probabilities for the 2,795
held-out validation images, so no images are needed to evaluate it.
Usage: python evaluate_validation.py [path/to/validation_predictions.csv]
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, multilabel_confusion_matrix

LABELS = ["healthy", "scab", "frog_eye_leaf_spot", "rust", "complex", "powdery_mildew"]
THRESHOLD = 0.5
csv = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "Downloads/outputs/validation_predictions.csv")
df = pd.read_csv(csv).fillna("")

P = df[[f"prob_{l}" for l in LABELS]].to_numpy()
T = df[[f"true_{l}" for l in LABELS]].to_numpy().astype(int)
pred = (P >= THRESHOLD).astype(int)
fallback = pred.sum(1) == 0
pred[fallback, P[fallback].argmax(1)] = 1

print(f"Validation images: {len(df)}   (rows where no class >= {THRESHOLD}: {fallback.sum()})")
print(f"Exact-match accuracy (all labels right): {(pred == T).all(1).mean():.3f}")
print(f"  - when confident : {(pred == T).all(1)[~fallback].mean():.3f}")
print(f"  - when uncertain : {(pred == T).all(1)[fallback].mean():.3f}")
print(f"Label-wise (binary) accuracy: {(pred == T).mean():.3f}\n")
print(classification_report(T, pred, target_names=LABELS, digits=3, zero_division=0))

print("Per-class binary confusion [[TN FP] [FN TP]]:")
for l, m in zip(LABELS, multilabel_confusion_matrix(T, pred)):
    print(f"  {l:<20s} {m.tolist()}")

# Single-label images only: true class vs. top-1 predicted class.
single = T.sum(1) == 1
top1 = P[single].argmax(1)
true1 = T[single].argmax(1)
cm = pd.crosstab(pd.Series([LABELS[i] for i in true1], name="true"),
                 pd.Series([LABELS[i] for i in top1], name="top-1 predicted"))
print(f"\nTop-1 confusion matrix on {single.sum()} single-label images:")
print(cm.reindex(index=LABELS, columns=LABELS, fill_value=0).to_string())
print(f"Top-1 accuracy (single-label images): {(top1 == true1).mean():.3f}")

s, f = LABELS.index("scab"), LABELS.index("frog_eye_leaf_spot")
print(f"\nScab <-> frog eye (single-label, top-1): frog_eye->scab {((true1 == f) & (top1 == s)).sum()}"
      f" of {(true1 == f).sum()}, scab->frog_eye {((true1 == s) & (top1 == f)).sum()} of {(true1 == s).sum()}")
