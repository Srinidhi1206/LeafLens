import { useEffect, useRef, useState } from "react";
import { AlertIcon, LeafIcon, RefreshIcon, ShieldIcon, UploadIcon, XIcon } from "./Icons.jsx";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXT = /\.(jpe?g|png)$/i;
const MAX_MB = 15;

const pct = (p) => `${(p * 100).toFixed(1)}%`;

export default function Detect() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectFile = (f) => {
    setError(null);
    setResult(null);
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.test(f.name)) {
      setError("Unsupported file type. Please upload a JPG, JPEG or PNG image.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Image is too large (max ${MAX_MB} MB).`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const detect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/predict", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || `Server error (${res.status}).`);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Could not reach the prediction server. Make sure the Flask backend is running."
          : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="detect" ref={sectionRef} className="scroll-mt-16 bg-gradient-to-b from-cream-50 to-leaf-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-leaf-500 uppercase">Disease detection</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-leaf-900 sm:text-4xl">
            Analyse an apple leaf
          </h2>
          <p className="mt-4 text-leaf-800/75">
            The model is trained on <strong>apple leaves only</strong>. For best results use a well-lit photo of
            one leaf on the tree that fills most of the frame.
          </p>
        </div>

        {result ? (
          <Results result={result} preview={preview} fileName={file?.name} onReset={reset} />
        ) : (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-leaf-100 bg-white p-6 shadow-xl shadow-leaf-900/5 sm:p-8">
            {!preview ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0]); }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                  dragging ? "border-leaf-500 bg-leaf-50" : "border-leaf-200 bg-cream-50 hover:border-leaf-400 hover:bg-leaf-50/60"
                }`}
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-leaf-100 text-leaf-600">
                  <UploadIcon className="h-8 w-8" />
                </span>
                <span className="mt-5 text-lg font-semibold text-leaf-900">Drag & drop a leaf image here</span>
                <span className="mt-1 text-sm text-leaf-800/70">
                  or <span className="font-semibold text-leaf-600 underline underline-offset-2">browse your files</span>
                </span>
                <span className="mt-4 text-xs text-leaf-800/50">JPG, JPEG or PNG · up to {MAX_MB} MB</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={(e) => selectFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <div>
                <div className="relative overflow-hidden rounded-2xl bg-leaf-900/5">
                  <img src={preview} alt="Uploaded leaf preview" className="mx-auto max-h-96 w-full object-contain" />
                  {loading && (
                    <div className="absolute inset-0 bg-leaf-900/20">
                      <div className="absolute inset-x-0 h-1 animate-scan bg-gradient-to-r from-transparent via-leaf-200 to-transparent shadow-[0_0_20px_4px_rgba(174,216,181,0.8)]" />
                    </div>
                  )}
                  {!loading && (
                    <button
                      onClick={reset}
                      aria-label="Remove image"
                      className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-leaf-800 shadow transition hover:bg-white hover:text-red-600"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="mt-3 truncate text-center text-sm text-leaf-800/70">{file?.name}</p>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={detect}
              disabled={!file || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-leaf-600 py-4 text-lg font-semibold text-white shadow-lg shadow-leaf-600/30 transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-leaf-300 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analysing leaf…
                </>
              ) : (
                <>
                  <LeafIcon className="h-5 w-5" /> Detect Disease
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Results({ result, preview, fileName, onReset }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const uncertain = result.fallback_used;
  const shown = uncertain ? [result.closest_match] : result.detected;
  const primary = shown[0];
  const healthy = result.is_healthy;

  return (
    <div ref={ref} className="mt-12 scroll-mt-24 animate-fade-up">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* image + headline */}
        <div className="overflow-hidden rounded-3xl border border-leaf-100 bg-white shadow-xl shadow-leaf-900/5 lg:col-span-2">
          <img src={preview} alt={fileName || "Analysed leaf"} className="h-72 w-full bg-leaf-900/5 object-contain" />
          <div className="p-6">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
                uncertain ? "bg-stone-200 text-stone-700" : healthy ? "bg-leaf-100 text-leaf-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {healthy && !uncertain ? <ShieldIcon className="h-4 w-4" /> : <AlertIcon className="h-4 w-4" />}
              {uncertain ? "Uncertain result" : healthy ? "Healthy leaf" : "Disease detected"}
            </span>
            {uncertain ? (
              <>
                <h3 className="mt-3 font-display text-2xl leading-snug font-semibold text-leaf-900">
                  Unable to confidently identify this leaf
                </h3>
                <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                    Closest match (not confirmed)
                  </p>
                  <p className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="text-lg font-semibold text-stone-800">{primary.name}</span>
                    <span className="font-mono text-sm tabular-nums text-stone-700">{pct(primary.probability)}</span>
                  </p>
                </div>
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <p>
                    No class reached the {pct(result.threshold)} confidence threshold. The closest match is only the
                    highest of several low scores and <strong>may be incorrect</strong>.
                  </p>
                  <p className="mt-1.5">
                    Common causes: the leaf is not an apple leaf (the model supports apple-leaf classes only), or the
                    photo looks very different from the orchard photos it was trained on (plain backgrounds, rulers,
                    several leaves, close-up crops). Try a photo of a single leaf on the tree.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-3 font-display text-3xl font-semibold text-leaf-900">
                  {result.detected.map((d) => d.name).join(" + ")}
                </h3>
                <p className="mt-2 text-sm text-leaf-800/70">
                  Model confidence for <strong>{primary.name}</strong>:{" "}
                  <strong className="text-leaf-700">{pct(primary.probability)}</strong>
                </p>
              </>
            )}
            <button
              onClick={onReset}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-leaf-600 py-3 font-semibold text-white shadow-md shadow-leaf-600/25 transition hover:bg-leaf-700"
            >
              <RefreshIcon className="h-5 w-5" /> Analyse another image
            </button>
          </div>
        </div>

        {/* probabilities */}
        <div className="rounded-3xl border border-leaf-100 bg-white p-6 shadow-xl shadow-leaf-900/5 sm:p-8 lg:col-span-3">
          <h4 className="text-lg font-semibold text-leaf-900">Probability per class</h4>
          <p className="mt-1 text-sm text-leaf-800/65">
            Multi-label sigmoid outputs. Classes above the {pct(result.threshold)} threshold count as detected.
          </p>
          <ul className="mt-6 space-y-4">
            {result.probabilities.map((p, i) => {
              const hit = result.detected.some((d) => d.label === p.label);
              const closest = uncertain && p.label === primary.label;
              return (
                <li key={p.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${hit || closest ? "text-leaf-900" : "text-leaf-800/70"}`}>
                      {p.name}
                      {hit && <span className="ml-2 rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf-700">detected</span>}
                      {closest && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700">closest, unconfirmed</span>}
                    </span>
                    <span className="font-mono tabular-nums text-leaf-800">{pct(p.probability)}</span>
                  </div>
                  <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-leaf-50">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ease-out ${hit ? "bg-leaf-500" : "bg-leaf-200"}`}
                      style={{ width: `${Math.max(p.probability * 100, 0.5)}%`, transitionDelay: `${i * 80}ms` }}
                    />
                    <div className="absolute inset-y-0 w-px bg-leaf-900/30" style={{ left: `${result.threshold * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* disease information */}
      <div className={`mt-6 grid gap-6 ${shown.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {shown.map((d) => (
          <div key={d.label} className="rounded-3xl border border-leaf-100 bg-white p-6 shadow-xl shadow-leaf-900/5 sm:p-8">
            {uncertain && (
              <p className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                About the closest match · not a confirmed diagnosis
              </p>
            )}
            <h4 className="font-display text-2xl font-semibold text-leaf-900">{d.name}</h4>
            {d.pathogen && <p className="mt-1 text-sm text-leaf-800/60 italic">{d.pathogen}</p>}
            <p className="mt-4 leading-relaxed text-leaf-800/80">{d.description}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h5 className="text-sm font-semibold tracking-wide text-leaf-600 uppercase">
                  {d.label === "healthy" ? "Signs" : "Typical symptoms"}
                </h5>
                <ul className="mt-3 space-y-2 text-sm text-leaf-800/80">
                  {d.symptoms.map((s) => (
                    <li key={s} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-400" />{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-semibold tracking-wide text-leaf-600 uppercase">
                  {d.label === "healthy" ? "Keep it healthy" : "Prevention & care"}
                </h5>
                <ul className="mt-3 space-y-2 text-sm text-leaf-800/80">
                  {d.prevention.map((s) => (
                    <li key={s} className="flex gap-2"><ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" />{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-leaf-800/60">
        This prediction comes from a student research model and is for educational purposes only. Consult an
        agricultural expert before making treatment decisions.
      </p>
    </div>
  );
}
