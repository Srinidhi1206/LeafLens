# LeafLens – Plant Disease Classification Website

A website for the *Plant Disease Classification Using Deep Learning* project. Upload an apple-leaf
photo and the trained MobileNetV2 model (`plant_pathology_mobilenetv2.keras`) predicts healthy / scab /
frog eye leaf spot / rust / complex / powdery mildew.

```
website/
├── backend/                 Flask API + serves the built frontend
│   ├── app.py               loads the model, /api/predict, /api/model-info
│   ├── disease_info.py      general disease descriptions & prevention tips
│   ├── requirements.txt
│   └── model/               trained model + metrics.json
├── frontend/                React + Vite + Tailwind CSS source (built into frontend/dist)
└── start_website.bat        one-click start on Windows
```

## Run

See the main [README](../README.md#setup-and-run). In short:

```bash
cd website/backend
python -m venv .venv            # Python 3.10 or 3.11
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Rebuild the frontend after changing it (needs Node.js 18+):

```bash
cd website/frontend
npm install
npm run build
```

For live frontend development run `npm run dev` (http://localhost:5173); API calls are proxied to Flask on port 5000.

## How the prediction matches the project code

* Image → RGB → 224 × 224 antialiased resize → rounded to uint8, exactly as `load_image()` in `train.py`
  (JPEG decode ratio 4 for full-size dataset photos, smaller ratio for small uploads).
* Raw 0–255 pixels go into the model; MobileNetV2 scaling to [-1, 1] is built into the saved model.
* Class order is the one in `train.py`, which produced the saved model:
  `healthy, scab, frog_eye_leaf_spot, rust, complex, powdery_mildew`
  (the notebook lists `powdery_mildew` before `complex`; using that order with this model file would swap those two labels).
* Sigmoid outputs, threshold 0.5. When no class passes, the API returns `detected: []` and the top-1
  class as an unconfirmed `closest_match`; the website shows "Unable to confidently identify this leaf".

## Tests and analysis

```bash
cd website/backend
python -m unittest -v test_app                       # API + label-mapping tests
python ../analysis/evaluate_validation.py            # per-class metrics & confusion matrix of the model
python ../analysis/probe_image.py "path/to/leaf.jpg" # score sensitivity of one image (crops / flips)
```

## Improving the model (not done here)

The model supports the six apple-leaf classes of Plant Pathology 2021 only. Retraining needs the
dataset (Kaggle, ~15 GB, Kaggle account + API token) and ideally a GPU. Realistic next steps:
set `FINE_TUNE = True` in the notebook (unfreezes the last 30 MobileNetV2 layers), train more epochs,
add colour/brightness augmentation, and add lab-style / plain-background leaf photos if the website
should handle them. Save the new model under a new name and evaluate it on the same validation split
before switching `MODEL_PATH`.
