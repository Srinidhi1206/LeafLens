import { ArrowIcon, LeafIcon } from "./Icons.jsx";

function LeafIllustration() {
  return (
    <svg viewBox="0 0 420 420" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="leafA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dbd89" />
          <stop offset="1" stopColor="#226736" />
        </linearGradient>
        <linearGradient id="leafB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aed8b5" />
          <stop offset="1" stopColor="#2f8043" />
        </linearGradient>
        <radialGradient id="apple" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f08b6b" />
          <stop offset="1" stopColor="#b8382a" />
        </radialGradient>
      </defs>

      {/* soft sun */}
      <circle cx="210" cy="210" r="175" fill="#d6ecd9" opacity="0.55" />
      <circle cx="210" cy="210" r="130" fill="#eef7ef" />

      {/* branch */}
      <path d="M40 330 C 140 300, 230 250, 380 120" stroke="#8a5a2f" strokeWidth="9" fill="none" strokeLinecap="round" />

      {/* main leaf */}
      <g transform="rotate(-28 220 210)">
        <path d="M220 70 C 310 120, 320 280, 220 350 C 120 280, 130 120, 220 70 Z" fill="url(#leafA)" />
        <path d="M220 80 L220 345" stroke="#eef7ef" strokeWidth="3" opacity="0.8" />
        {[120, 160, 200, 240, 280].map((y, i) => (
          <g key={y} stroke="#eef7ef" strokeWidth="2" opacity="0.6" fill="none">
            <path d={`M220 ${y} Q ${255 + i * 2} ${y - 18} ${272 - i * 3} ${y - 30}`} />
            <path d={`M220 ${y} Q ${185 - i * 2} ${y - 18} ${168 + i * 3} ${y - 30}`} />
          </g>
        ))}
        {/* scan frame */}
        <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M150 130 v-24 h24" /><path d="M290 130 v-24 h-24" />
          <path d="M150 300 v24 h24" /><path d="M290 300 v24 h-24" />
        </g>
      </g>

      {/* small leaves */}
      <path d="M330 150 C 365 140, 395 160, 400 190 C 370 200, 340 185, 330 150 Z" fill="url(#leafB)" />
      <path d="M90 300 C 70 270, 80 240, 105 228 C 120 255, 115 285, 90 300 Z" fill="url(#leafB)" />

      {/* apple */}
      <g transform="translate(300 250)">
        <path d="M0 8 C -30 -12, -52 20, -40 48 C -30 72, -10 76, 0 68 C 10 76, 30 72, 40 48 C 52 20, 30 -12, 0 8 Z" fill="url(#apple)" />
        <path d="M0 8 C 2 -6, 6 -14, 12 -20" stroke="#6b4423" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M4 -8 C 16 -22, 32 -20, 36 -12 C 24 -2, 12 -4, 4 -8 Z" fill="#4f9e5f" />
        <ellipse cx="-18" cy="22" rx="8" ry="12" fill="#ffffff" opacity="0.25" />
      </g>
    </svg>
  );
}

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-leaf-50 via-cream-50 to-cream-50 pt-28 pb-20 sm:pt-32">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-leaf-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-cream-200/70 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-leaf-700 uppercase">
            <LeafIcon className="h-4 w-4" /> Deep Learning · Transfer Learning
          </span>
          <h1 className="mt-6 font-display text-4xl leading-tight font-semibold text-leaf-900 sm:text-5xl lg:text-6xl">
            Plant Disease Classification <span className="text-leaf-500">Using Deep Learning</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-leaf-800/80">
            Upload a photo of an apple leaf and our CNN — a MobileNetV2 network adapted through transfer
            learning to the Plant Pathology 2021 dataset — identifies scab, rust, frog eye leaf spot,
            powdery mildew, complex infections, or a healthy leaf in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#detect"
              className="group inline-flex items-center gap-2 rounded-full bg-leaf-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-leaf-600/30 transition hover:-translate-y-0.5 hover:bg-leaf-700"
            >
              Detect Disease
              <ArrowIcon className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#about"
              className="inline-flex items-center rounded-full border border-leaf-300 bg-white px-7 py-3.5 font-semibold text-leaf-700 transition hover:border-leaf-500"
            >
              About the Project
            </a>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {[
              ["18,632", "Leaf images"],
              ["6", "Classes"],
              ["0.93", "Val. ROC-AUC"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-leaf-100 bg-white/70 p-4 text-center">
                <dt className="font-display text-2xl font-semibold text-leaf-700">{v}</dt>
                <dd className="mt-1 text-xs text-leaf-800/70">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md animate-float">
          <LeafIllustration />
        </div>
      </div>
    </section>
  );
}
