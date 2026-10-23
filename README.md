# LeafLens

**Plant Disease Classification using Deep Learning (CNN / Transfer Learning)**

LeafLens is a web application that classifies apple-leaf photos into six classes from the
[Plant Pathology 2021 – FGVC8](https://www.kaggle.com/competitions/plant-pathology-2021-fgvc8) dataset:
**healthy, scab, frog eye leaf spot, rust, complex, powdery mildew**. A MobileNetV2 network pre-trained
on ImageNet is used as a frozen feature extractor with a 6-unit sigmoid head (multi-label classification).

> Educational project. The model supports **apple leaves only** and is not a substitute for professional
> agricultural advice.

## Features

- Upload a leaf photo by drag & drop or file picker (JPG, JPEG, PNG), with preview and remove
- Real-time prediction from the trained Keras model through a Flask API
- Score for every class, threshold marker, and disease information with prevention tips
- Honest uncertainty handling: when no class reaches 50 %, the site shows
  *"Unable to confidently identify this leaf"* and the closest class only as an unconfirmed match
- About page with dataset, model details and the model's real validation metrics
- Responsive green / cream design (React + Tailwind CSS)
- Backend tests and model-analysis scripts

## Model results (validation set, 2,795 held-out images)

| Metric | Value |
|---|---|
| Macro F1 | 0.725 |
| Micro F1 | 0.743 |
| ROC-AUC (macro) | 0.930 |
| Exact-match accuracy | 0.690 |

| Class | Precision | Recall | F1 |
|---|---|---|---|
| healthy | 0.781 | 0.901 | 0.837 |
| scab | 0.767 | 0.732 | 0.749 |
| frog_eye_leaf_spot | 0.642 | 0.780 | 0.704 |
| rust | 0.890 | 0.651 | 0.752 |
| complex | 0.676 | 0.371 | 0.479 |
| powdery_mildew | 0.906 | 0.763 | 0.829 |

## Technology stack

| Layer | Technologies |
|---|---|
| Model & training | Python, TensorFlow / Keras (MobileNetV2), NumPy, Pandas, scikit-learn, Pillow |
| Backend | Flask (REST API, also serves the built frontend) |
| Frontend | React 18, Vite 5, Tailwind CSS 4 |

## Project structure

```
LeafLens/
├── Plant_Disease_Classification.ipynb   # full pipeline notebook (Google Colab)
├── training/
│   ├── train.py                         # script that produced the included model
│   ├── download_dataset.py              # downloads the Kaggle dataset (needs your Kaggle account)
│   └── requirements.txt
└── website/
    ├── backend/
    │   ├── app.py                       # Flask API: /api/predict, /api/model-info
    │   ├── disease_info.py              # disease descriptions & prevention tips
    │   ├── test_app.py                  # backend tests
    │   ├── requirements.txt
    │   └── model/
    │       ├── plant_pathology_mobilenetv2.keras   # trained model (9.7 MB)
    │       └── metrics.json
    ├── frontend/                        # React + Vite + Tailwind source; dist/ = built site
    ├── analysis/                        # evaluation & diagnostic scripts
    └── start_website.bat                # one-click start on Windows
```

## Setup and run

Requirements: Python 3.10 or 3.11 (TensorFlow 2.16 does not support newer versions on Windows).
Node.js is only needed if you change the frontend — the built site is included in `website/frontend/dist`.

```bash
git clone https://github.com/Srinidhi1206/LeafLens.git
cd LeafLens/website/backend
python -m venv .venv
```

Activate the environment — Windows: `.venv\Scripts\activate` · macOS/Linux: `source .venv/bin/activate`

```bash
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000**. On Windows you can also double-click `website/start_website.bat`
after creating `website/backend/.venv`.

### Rebuild the frontend (optional)

```bash
cd website/frontend
npm install
npm run build      # production build served by Flask
npm run dev        # dev server on http://localhost:5173, API proxied to Flask on port 5000
```

### Tests and analysis

```bash
cd website/backend
python -m unittest -v test_app
python ../analysis/evaluate_validation.py path/to/validation_predictions.csv
python ../analysis/evaluate_folder.py path/to/labelled_image_folders
python ../analysis/probe_image.py path/to/leaf.jpg
```

Tests that need `validation_predictions.csv` or a sample image (produced locally by training) are
skipped automatically when those files are absent.

## How prediction works

1. The image is decoded to RGB and resized to 224 × 224 with antialiasing, exactly as in `training/train.py`.
2. Raw 0–255 pixels are passed to the model; MobileNetV2 scaling to [-1, 1] is built into the saved model.
3. The six sigmoid scores are thresholded at 0.5. Classes above it are reported as detected; if none
   passes, the result is shown as uncertain with the top class as an unconfirmed closest match.

Class order of the model output: `healthy, scab, frog_eye_leaf_spot, rust, complex, powdery_mildew`.

## Retraining

The dataset is **not** included (Kaggle competition rules do not allow redistribution). To retrain:
accept the rules on the competition page, create a Kaggle API token, then either run the notebook in
Google Colab (GPU) or:

```bash
cd training
pip install -r requirements.txt
python download_dataset.py
python train.py --data_dir data/plant-pathology-2021-fgvc8 --epochs 5
```

Save improved models under a new name and compare them on the same validation split before replacing
`website/backend/model/plant_pathology_mobilenetv2.keras`.

## Limitations

- Supports apple leaves only; other plants (e.g. potato, tomato) give meaningless results.
- Trained on orchard photos; lab-style photos (plain background, rulers, several leaves) often get low,
  unreliable scores.
- Baseline model: frozen backbone, 5 epochs. The *complex* class is the weakest (F1 0.48).

## Acknowledgements

Dataset: Thapa, R., Zhang, K., Snavely, N., Belongie, S., Khan, A. *Plant Pathology 2021 – FGVC8*. Kaggle, 2021.
