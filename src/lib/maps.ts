export type MapsProvider = "apple" | "google";

function appleMapsUrl(query: string): string {
  return `https://maps.apple.com/?daddr=${query}`;
}

function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildMapsUrl(query: string, provider: MapsProvider): string {
  return provider === "apple" ? appleMapsUrl(query) : googleMapsUrl(query);
}

/**
 * Opens navigation for the given (already URI-encoded) address query using
 * the company's chosen maps provider. On iOS/Android this hands off to the
 * app via a deep/universal link; on desktop it opens in a new tab so the
 * job page stays open.
 */
export function openMaps(query: string, provider: MapsProvider) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /iPad|iPhone|iPod|Android/.test(ua);
  const url = buildMapsUrl(query, provider);

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
