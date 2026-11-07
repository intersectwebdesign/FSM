/**
 * Free geocoding via OpenStreetMap's Nominatim API -- no API key, but
 * usage-policy limited to ~1 request/second and requires an identifying
 * User-Agent. Fine for occasional site-address lookups; not for bulk/live
 * autocomplete.
 */
export async function geocodeAddress(
  parts: (string | null | undefined)[]
): Promise<{ latitude: number; longitude: number } | null> {
  const query = parts.filter(Boolean).join(", ");
  if (!query) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "FieldServiceApp/1.0 (intersectwebdesign@gmail.com)",
      },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as { lat: string; lon: string }[];
    if (!results || results.length === 0) return null;

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
