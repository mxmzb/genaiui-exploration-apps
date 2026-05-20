interface MarkdownProps {
  data: string;
}

export function Markdown({ data }: MarkdownProps) {
  return (
    <div className="prose prose-sm max-w-none text-[var(--sea-ink)]">
      {data.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}
