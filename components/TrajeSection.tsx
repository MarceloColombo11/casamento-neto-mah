type TrajeSectionProps = {
  paragraphs: string[];
};

export function TrajeSection({ paragraphs }: TrajeSectionProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
        Traje
      </h2>

      <div className="mt-6 space-y-5 text-pretty text-base leading-relaxed text-navy/80 sm:text-lg">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
