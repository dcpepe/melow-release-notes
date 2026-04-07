export default function Gif({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      <img
        src={src}
        alt={caption || ""}
        className="w-full rounded-lg"
        style={{ border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-gold-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
