import { useChatAction } from "#/components/ChatView";

interface DetailViewProps {
  id: string;
  title: string;
  neighborhood: string;
  rent: number;
  bedrooms: string;
  sqft: number;
  imageUrl: string;
  description: string;
  amenities: string[];
  nearbyTransit: { type: string; name: string; distance: string }[];
  petPolicy: string;
  availableFrom: string;
  reviews: { author: string; rating: number; text: string }[];
}

export function DetailView({
  id,
  title,
  neighborhood,
  rent,
  bedrooms,
  sqft,
  imageUrl,
  description,
  amenities,
  nearbyTransit,
  petPolicy,
  availableFrom,
  reviews,
}: DetailViewProps) {
  const send = useChatAction();

  return (
    <div className="space-y-4">
      <img src={imageUrl} alt={title} className="h-56 w-full rounded-xl object-cover" />
      <div>
        <h2 className="text-xl font-bold text-[var(--sea-ink)]">{title}</h2>
        <p className="text-sm text-[var(--sea-ink-soft)]">{neighborhood}</p>
      </div>
      <div className="flex gap-4 text-sm">
        <span className="font-semibold text-[var(--lagoon-deep)]">${rent?.toLocaleString()}/mo</span>
        <span>{bedrooms}</span>
        <span>{sqft?.toLocaleString()} sqft</span>
        <span>Available {availableFrom}</span>
      </div>
      <p className="text-sm text-[var(--sea-ink)]">{description}</p>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">Amenities</h3>
        <div className="flex flex-wrap gap-1.5">
          {amenities?.map((a) => (
            <span key={a} className="rounded-full bg-[var(--foam)] px-2.5 py-0.5 text-xs text-[var(--sea-ink-soft)]">
              {a}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">Nearby Transit</h3>
        <ul className="space-y-1 text-sm text-[var(--sea-ink-soft)]">
          {nearbyTransit?.map((t) => (
            <li key={t.name}>{t.name} — {t.distance}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm"><span className="font-semibold">Pet Policy:</span> {petPolicy}</p>

      {reviews?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">Reviews</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.author} className="rounded-lg bg-[var(--foam)] p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{r.author}</span>
                  <span className="text-[var(--lagoon)]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => send(`I'd like to schedule a tour for apartment ${id}`)}
          className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)]"
        >
          Schedule Tour
        </button>
        <button
          onClick={() => send("Show me the previous search results again")}
          className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--foam)]"
        >
          Back to Results
        </button>
      </div>
    </div>
  );
}
