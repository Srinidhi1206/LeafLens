import { useEffect, useState } from "react";
import { LeafIcon } from "./Icons.jsx";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#detect", label: "Detect" },
  { href: "#about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-cream-50/85 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-white shadow-md shadow-leaf-600/30">
            <LeafIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-leaf-800">LeafLens</span>
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-leaf-800 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-leaf-500">{l.label}</a>
            </li>
          ))}
        </ul>
        <a
          href="#detect"
          className="hidden rounded-full bg-leaf-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-leaf-600/25 transition hover:bg-leaf-700 md:inline-block"
        >
          Detect Disease
        </a>

        <button
          className="rounded-lg p-2 text-leaf-800 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="mx-4 mb-3 space-y-1 rounded-2xl border border-leaf-100 bg-white p-3 shadow-lg md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 font-medium text-leaf-800 hover:bg-leaf-50"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
