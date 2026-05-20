import { useChatAction } from "#/components/ChatView";

interface ApartmentCardProps {
  id: string;
  title: string;
  neighborhood: string;
  rent: number;
  bedrooms: string;
  sqft: number;
  imageUrl: string;
}

export function ApartmentCard({
  id,
  title,
  neighborhood,
  rent,
  bedrooms,
  sqft,
  imageUrl,
}: ApartmentCardProps) {
  const send = useChatAction();

  return (
    <div className="island-shell overflow-hidden rounded-xl">
      <img
        src={imageUrl}
        alt={title}
        className="h-40 w-full object-cover"
      />
      <div className="p-4">
        <h3 className="text-base font-bold text-[var(--sea-ink)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{neighborhood}</p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="font-semibold text-[var(--lagoon-deep)]">
            ${rent?.toLocaleString()}/mo
          </span>
          <span className="text-[var(--sea-ink-soft)]">{bedrooms}</span>
          <span className="text-[var(--sea-ink-soft)]">{sqft?.toLocaleString()} sqft</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => send(`Show me details for apartment ${id}`)}
            className="rounded-lg bg-[var(--lagoon)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--lagoon-deep)]"
          >
            View Details
          </button>
          <button
            onClick={() => send(`I'd like to schedule a tour for apartment ${id}`)}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--foam)]"
          >
            Schedule Tour
          </button>
        </div>
      </div>
    </div>
  );
}
