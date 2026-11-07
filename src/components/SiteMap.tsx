export function SiteMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label?: string;
}) {
  const delta = 0.004;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const externalHref = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <iframe
        title={label ?? "Site map"}
        src={src}
        className="h-56 w-full"
        loading="lazy"
      />
      <a
        href={externalHref}
        target="_blank"
        rel="noreferrer"
        className="block bg-zinc-50 px-3 py-1.5 text-center text-xs text-zinc-500 hover:text-zinc-900"
      >
        View larger map
      </a>
    </div>
  );
}
