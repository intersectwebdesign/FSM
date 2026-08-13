"use client";

import { useState } from "react";
import Link from "next/link";

export function OfficeNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-4 lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-full z-20 flex w-56 flex-col gap-1 border-b border-zinc-200 bg-white p-2 shadow-lg lg:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
