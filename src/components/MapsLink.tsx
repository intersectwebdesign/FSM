"use client";

import { buildMapsUrl, openMaps, type MapsProvider } from "@/lib/maps";

export function MapsLink({
  query,
  provider,
  children,
  className,
}: {
  query: string;
  provider: MapsProvider;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={buildMapsUrl(query, provider)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.preventDefault();
        openMaps(query, provider);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
