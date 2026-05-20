import type { ReactNode } from "react";

interface ApartmentListProps {
  title: string;
  children: ReactNode;
}

export function ApartmentList({ title, children }: ApartmentListProps) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-[var(--sea-ink)]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
