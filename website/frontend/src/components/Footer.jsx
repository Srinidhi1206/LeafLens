import { LeafIcon } from "./Icons.jsx";

export default function Footer() {
  return (
    <footer className="bg-leaf-900 text-leaf-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-500 text-white">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold text-white">LeafLens</span>
          </div>
          <p className="mt-3 text-sm text-leaf-100/70">
            Plant Disease Classification Using Deep Learning (CNN / Transfer Learning) — apple-leaf disease
            detection with a MobileNetV2 model.
          </p>
        </div>
        <div className="max-w-sm text-sm">
          <h4 className="font-semibold text-white">Dataset</h4>
          <p className="mt-3 text-leaf-100/75">
            Thapa, R., Zhang, K., Snavely, N., Belongie, S., Khan, A. <em>Plant Pathology 2021 – FGVC8</em>. Kaggle, 2021.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-leaf-100/50">
        Educational project · Not a substitute for professional agricultural advice
      </div>
    </footer>
  );
}
