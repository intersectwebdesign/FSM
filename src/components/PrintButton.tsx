"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
    >
      Print / Save as PDF
    </button>
  );
}
