import { useState, type FormEvent } from "react";

const suggestions = [
  {
    label: "A little room to grow",
    detail: "2 bedrooms · under $4,000",
    prompt: "Show me 2-bedroom apartments under $4,000 per month",
  },
  {
    label: "See the real monthly costs",
    detail: "Compare three apartments",
    prompt: "Compare apartments 2, 7 and 13 by total monthly cost, space, pet restrictions and transit. Show their base rents and mandatory fees separately.",
  },
  {
    label: "Room to explore",
    detail: "Twelve places across the city",
    prompt: "Show twelve apartments sorted by rent, including photos, monthly cost, bedrooms, bathrooms, area and actions for each.",
  },
];

export function Welcome({
  send,
  busy = false,
}: {
  send: (text: string) => void;
  busy?: boolean;
}) {
  return (
    <section className="welcome">
      <div className="welcome-copy">
        <p className="eyebrow">For whatever comes next</p>
        <h1>
          Find your
          <br />
          <em>next place.</em>
        </h1>
        <p className="welcome-description">
          A sunny kitchen. Room for a dog. Your favorite neighborhood. Let’s
          find a place that feels like you.
        </p>
        <div className="suggestions" aria-label="Search ideas">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => send(s.prompt)}
              disabled={busy}
            >
              <span>
                <strong>{s.label}</strong>
                <small>{s.detail}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
      <div className="welcome-photo">
        <img
          src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=1000&fit=crop"
          alt="A bright apartment with tall windows, plants, and a comfortable sofa"
        />
        <p className="photo-caption">A new chapter starts somewhere.</p>
      </div>
    </section>
  );
}

export function Composer({
  send,
  busy,
}: {
  send: (text: string) => void;
  busy: boolean;
}) {
  const [input, setInput] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy) return;
    send(input.trim());
    setInput("");
  }
  return (
    <div className="composer-wrap">
      <form
        onSubmit={submit}
        className="composer"
        aria-label="Apartment search"
      >
        <span className="composer-symbol" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </span>
        <label className="sr-only" htmlFor="apartment-search">
          What are you looking for?
        </label>
        <input
          id="apartment-search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="A two-bedroom with natural light, under $4,000…"
          autoComplete="off"
          disabled={busy}
        />
        <button
          className="send-button"
          type="submit"
          disabled={!input.trim() || busy}
          aria-label="Send message"
        >
          {busy ? (
            <span className="spinner" />
          ) : (
            <span aria-hidden="true">→</span>
          )}
        </button>
      </form>
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>Finding your kind of place…</span>
    </div>
  );
}

// Keep internal action payloads out of the conversation's presentation.
export function requestLabel(text: string) {
  if (/^Show me details for apartment \d+$/.test(text))
    return "Let’s take a closer look at this apartment.";
  if (/^I'd like to schedule a tour for apartment \d+$/.test(text))
    return "I’d like to arrange a tour.";
  if (text.startsWith("Confirm my demo tour request for apartment "))
    return "Here are my details for the demo tour request.";
  if (
    text ===
    "Show me the previous search results again, keeping my original filters."
  )
    return "Back to the places I found.";
  return text;
}
