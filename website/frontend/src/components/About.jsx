import { useEffect, useState } from "react";
import { AlertIcon, BrainIcon, ChartIcon, LeafIcon } from "./Icons.jsx";
import { apiUrl } from "../api.js";

const CLASS_NAMES = {
  healthy: "Healthy",
  scab: "Scab",
  frog_eye_leaf_spot: "Frog eye leaf spot",
  rust: "Rust",
  complex: "Complex",
  powdery_mildew: "Powdery mildew",
};

const TECH = [
  ["Python", "Model training & inference"],
  ["TensorFlow / Keras", "MobileNetV2, training loop"],
  ["NumPy · Pandas · Pillow", "Data & image preprocessing"],
  ["scikit-learn", "Train/val split, F1 metrics"],
  ["Flask", "Prediction REST API"],
  ["React · Vite · Tailwind CSS", "This website"],
];

const LIMITATIONS = [
  "Trained only on apple leaves from the Plant Pathology 2021 dataset. Other crops (e.g. potato, tomato) are not supported and will give meaningless results.",
  "Low-confidence predictions (no class above 50%) are right only about 44% of the time on validation data, versus about 75% for confident predictions.",
  "Photos were taken in orchards under specific conditions; very different lighting, backgrounds or blurry images reduce accuracy.",
  "The 'complex' class is the weakest (F1 ≈ 0.48) because it covers mixed and unclear symptoms.",
  "The backbone was kept frozen and trained for only 5 epochs, so this is a baseline rather than a state-of-the-art model.",
  "The model always outputs one of its six classes, even for images that are not leaves at all.",
];

function Card({ icon: Icon, title, children, className = "" }) {
  return (
    <div className={`reveal rounded-3xl border border-leaf-100 bg-white p-7 shadow-lg shadow-leaf-900/5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-100 text-leaf-600">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-xl font-semibold text-leaf-900">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 leading-relaxed text-leaf-800/80">{children}</div>
    </div>
  );
}

export default function About() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/model-info")).then((r) => (r.ok ? r.json() : null)).then(setInfo).catch(() => setInfo(null));
  }, []);
  const m = info?.metrics;

  const stats = m
    ? [
        ["Macro F1", m.f1_with_top1_fallback.macro],
        ["Micro F1", m.f1_with_top1_fallback.micro],
        ["ROC-AUC", m.val_auc],
        ["Exact match", m.exact_match_accuracy],
      ]
    : [];

  return (
    <section id="about" className="scroll-mt-16 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-leaf-500 uppercase">About the project</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-leaf-900 sm:text-4xl">
            Early detection for healthier orchards
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Card icon={LeafIcon} title="Problem & objective">
            <p>
              Apple orchards lose a large share of their yield to foliar diseases such as scab, rust and powdery
              mildew. Diagnosis by eye is slow, needs trained experts and is hard to scale across large farms.
            </p>
            <p>
              The objective of this project is to build a deep-learning model that automatically classifies an
              apple-leaf photo into healthy or one or more disease categories, supporting faster and more
              consistent early detection.
            </p>
          </Card>

          <Card icon={ChartIcon} title="Dataset">
            <p>
              <strong>Plant Pathology 2021 – FGVC8</strong> (Kaggle): 18,632 labelled high-resolution apple-leaf
              photos, split into {m ? m.num_train_images.toLocaleString() : "15,837"} training and{" "}
              {m ? m.num_val_images.toLocaleString() : "2,795"} validation images. A leaf can carry several labels,
              so the task is <em>multi-label</em> classification.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.values(CLASS_NAMES).map((c) => (
                <span key={c} className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-medium text-leaf-700">{c}</span>
              ))}
            </div>
          </Card>

          <Card icon={BrainIcon} title="Model" className="lg:col-span-2">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p>
                  <strong>MobileNetV2</strong> pre-trained on ImageNet, used as a frozen feature extractor, followed by
                  global average pooling, dropout and a dense layer with <strong>6 sigmoid outputs</strong> (one per
                  class).
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li>• Input: 224 × 224 RGB, scaled to [-1, 1]</li>
                  <li>• Augmentation: random flips, rotation and zoom</li>
                  <li>• Loss: binary cross-entropy · Optimizer: Adam (lr 1e-3)</li>
                  <li>• {m ? m.epochs_run : 5} training epochs · decision threshold {info?.threshold ?? 0.5} with top-1 fallback</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-leaf-600 uppercase">Validation results</p>
                {m ? (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {stats.map(([l, v]) => (
                        <div key={l} className="rounded-2xl bg-cream-50 p-4 text-center">
                          <div className="font-display text-2xl font-semibold text-leaf-700">{v.toFixed(3)}</div>
                          <div className="text-xs text-leaf-800/70">{l}</div>
                        </div>
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2">
                      {Object.entries(m.per_class_f1).map(([k, v]) => (
                        <li key={k} className="flex items-center gap-3 text-sm">
                          <span className="w-36 shrink-0">{CLASS_NAMES[k] ?? k}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-leaf-50">
                            <span className="block h-full rounded-full bg-leaf-400" style={{ width: `${v * 100}%` }} />
                          </span>
                          <span className="w-10 text-right font-mono tabular-nums">{v.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-leaf-800/55">Per-class F1 score on the validation set.</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-leaf-800/60">Metrics load from the backend when it is running.</p>
                )}
              </div>
            </div>
          </Card>

          <Card icon={BrainIcon} title="CNN & transfer learning, simply put">
            <p>
              A <strong>Convolutional Neural Network (CNN)</strong> looks at an image through many small filters.
              Early layers detect edges and colours, deeper layers combine them into textures, spots and shapes —
              exactly the cues that distinguish one leaf disease from another.
            </p>
            <p>
              <strong>Transfer learning</strong> reuses a CNN already trained on millions of everyday images
              (ImageNet). Its general visual knowledge is kept, and only a small new classification layer is
              trained on leaf photos. This gives good accuracy with far less data and compute.
            </p>
          </Card>

          <Card icon={ChartIcon} title="Technologies used">
            <ul className="grid gap-3 sm:grid-cols-2">
              {TECH.map(([t, d]) => (
                <li key={t} className="rounded-2xl bg-cream-50 p-3">
                  <div className="font-semibold text-leaf-900">{t}</div>
                  <div className="text-sm text-leaf-800/70">{d}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Card icon={AlertIcon} title="Limitations & disclaimer" className="lg:col-span-2">
            <ul className="space-y-2">
              {LIMITATIONS.map((l) => (
                <li key={l} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-soil-500" />{l}</li>
              ))}
            </ul>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Educational use only.</strong> This website is a college project demonstration. Its
              predictions are not a professional plant-health diagnosis and should not be the sole basis for
              applying treatments or pesticides.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
