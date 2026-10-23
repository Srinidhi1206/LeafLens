import { BrainIcon, ChartIcon, UploadIcon } from "./Icons.jsx";

const STEPS = [
  {
    Icon: UploadIcon,
    title: "Upload Image",
    text: "Choose or drag in a clear photo of a single apple leaf (JPG, JPEG or PNG).",
  },
  {
    Icon: BrainIcon,
    title: "AI Analysis",
    text: "The image is resized to 224 × 224 and passed through the trained MobileNetV2 model.",
  },
  {
    Icon: ChartIcon,
    title: "View Results",
    text: "See the detected condition, the model's probability for every class, and prevention tips.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-leaf-500 uppercase">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-leaf-900 sm:text-4xl">
            From leaf photo to diagnosis in three steps
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li
              key={title}
              className="reveal group relative rounded-3xl border border-leaf-100 bg-cream-50 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-leaf-900/5"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span className="absolute top-6 right-7 font-display text-5xl font-semibold text-leaf-100">
                0{i + 1}
              </span>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-leaf-600 text-white shadow-lg shadow-leaf-600/25 transition group-hover:scale-105">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-leaf-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-leaf-800/75">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
