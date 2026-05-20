import { useState } from "react";
import { useChatAction } from "#/components/ChatView";

interface TourFormProps {
  apartmentId: string;
  apartmentTitle: string;
}

export function TourForm({ apartmentId, apartmentTitle }: TourFormProps) {
  const send = useChatAction();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    message: "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--sea-ink)]">
        Schedule a Tour — {apartmentTitle}
      </h2>
      <div className="tour-form space-y-3">
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[var(--lagoon)]"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[var(--lagoon)]"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[var(--lagoon)]"
        />
        <input
          name="preferredDate"
          type="date"
          value={formData.preferredDate}
          onChange={(e) => update("preferredDate", e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[var(--lagoon)]"
        />
        <textarea
          name="message"
          placeholder="Message (optional)"
          rows={3}
          value={formData.message}
          onChange={(e) => update("message", e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[var(--lagoon)]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const fields = Object.entries(formData)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            send(
              fields
                ? `Confirm my tour request for apartment ${apartmentId}. Here are my details: ${fields}`
                : `Confirm my tour request for apartment ${apartmentId}`,
            );
          }}
          className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)]"
        >
          Submit
        </button>
        <button
          onClick={() => send("Cancel the tour request, show me the previous search results")}
          className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--foam)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
