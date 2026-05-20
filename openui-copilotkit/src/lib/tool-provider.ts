export const toolProvider: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  get_neighborhoods: async () => {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "get_neighborhoods", args: {} }),
    });
    return res.json();
  },
  get_apartments: async (args) => {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "get_apartments", args }),
    });
    return res.json();
  },
  submit_tour: async (args) => {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "submit_tour", args }),
    });
    return res.json();
  },
};
