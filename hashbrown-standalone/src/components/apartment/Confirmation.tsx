interface ConfirmationProps {
  title: string;
  message: string;
}

export function Confirmation({ title, message }: ConfirmationProps) {
  return (
    <div className="rounded-xl bg-[var(--foam)] p-6 text-center">
      <div className="mb-3 text-3xl">✓</div>
      <h2 className="text-lg font-bold text-[var(--sea-ink)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{message}</p>
    </div>
  );
}
