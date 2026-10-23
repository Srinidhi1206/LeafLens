"""Backend tests. Run from website/backend:  python -m unittest -v test_app"""
import ast
import io
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

import app as backend

DOWNLOADS = Path.home() / "Downloads"
TRAIN_PY = Path(__file__).resolve().parents[2] / "training" / "train.py"
# Optional local files; the tests that need them are skipped when absent.
VAL_CSV = DOWNLOADS / "outputs/validation_predictions.csv"
TEST_IMAGE = DOWNLOADS / "frog-eye leaf.jpg"


def image_bytes(color, fmt="PNG", size=(400, 300)):
    buf = io.BytesIO()
    Image.fromarray(np.full((size[1], size[0], 3), color, np.uint8)).save(buf, fmt)
    return buf.getvalue()


class LabelMappingTests(unittest.TestCase):
    @unittest.skipUnless(TRAIN_PY.exists(), "train.py not found")
    def test_labels_match_train_py(self):
        tree = ast.parse(TRAIN_PY.read_text(encoding="utf-8"))
        labels = next(ast.literal_eval(n.value) for n in tree.body
                      if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "LABELS")
        self.assertEqual(backend.LABELS, labels)

    @unittest.skipUnless(VAL_CSV.exists(), "validation_predictions.csv not found")
    def test_decoding_reproduces_saved_validation_predictions(self):
        import pandas as pd
        df = pd.read_csv(VAL_CSV).fillna("")
        probs = df[[f"prob_{l}" for l in backend.LABELS]].to_numpy()
        # train.py uses >= threshold, the backend > threshold; identical unless a score is exactly 0.5.
        decoded = [" ".join(l for l, v in zip(backend.LABELS, backend.decode_predictions(p)) if v) for p in probs]
        self.assertEqual(decoded, df["pred_labels"].tolist())


class PredictApiTests(unittest.TestCase):
    def setUp(self):
        self.client = backend.app.test_client()

    def post(self, data, name):
        return self.client.post("/api/predict", data={"image": (io.BytesIO(data), name)},
                                content_type="multipart/form-data")

    def test_missing_file(self):
        self.assertEqual(self.client.post("/api/predict").status_code, 400)

    def test_wrong_extension(self):
        self.assertEqual(self.post(b"hello", "notes.txt").status_code, 400)

    def test_corrupt_image(self):
        self.assertEqual(self.post(b"not an image", "leaf.jpg").status_code, 400)

    def test_response_shape_and_scores(self):
        for fmt, name in (("PNG", "leaf.png"), ("JPEG", "leaf.jpg")):
            d = self.post(image_bytes((60, 140, 50), fmt), name).get_json()
            self.assertEqual({p["label"] for p in d["probabilities"]}, set(backend.LABELS))
            self.assertTrue(all(0.0 <= p["probability"] <= 1.0 for p in d["probabilities"]))

    def test_confident_prediction_is_detected(self):
        d = self.post(image_bytes((60, 140, 50)), "green.png").get_json()
        top = max(d["probabilities"], key=lambda p: p["probability"])
        self.assertGreater(top["probability"], backend.THRESHOLD)
        self.assertFalse(d["fallback_used"])
        self.assertIsNone(d["closest_match"])
        self.assertIn(top["label"], [x["label"] for x in d["detected"]])

    @unittest.skipUnless(TEST_IMAGE.exists(), "frog-eye leaf.jpg not found")
    def test_uncertain_prediction_is_not_reported_as_detected(self):
        d = self.post(TEST_IMAGE.read_bytes(), TEST_IMAGE.name).get_json()
        top = max(d["probabilities"], key=lambda p: p["probability"])
        self.assertLess(top["probability"], backend.THRESHOLD)
        self.assertTrue(d["fallback_used"])
        self.assertEqual(d["detected"], [])
        self.assertFalse(d["is_healthy"])
        self.assertEqual(d["closest_match"]["label"], top["label"])
        self.assertAlmostEqual(d["closest_match"]["probability"], top["probability"])


if __name__ == "__main__":
    unittest.main()
