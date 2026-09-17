type GrandeDiaSectionProps = {
  paragraphs: string[];
};

export function GrandeDiaSection({ paragraphs }: GrandeDiaSectionProps) {
  return (
    <div className="mx-auto max-w-7xl text-center">
      <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
        O Grande Dia
      </h2>
      <div className="mx-auto mt-6 max-w-2xl space-y-4 text-pretty text-base leading-relaxed text-navy/80 sm:text-lg">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
