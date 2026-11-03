// Scripted positive/negative controls, never live benchmark evidence.
export function fixture(task: any, mode = "valid") {
  const elements: any = {};
  const node = (id: string, type: string, props: any, children?: string[]) => { elements[id] = { type, props, ...(children ? { children } : {}) }; return id; };
  const item = (field: string) => ({ $item: field });
  const metric = (id: string, label: string, value: any, format = "text") => node(id, "Metric", { label, value, format });
  const content = [node("title", "Heading", { text: item("title") }), node("neighborhood", "Badge", { text: item("neighborhood") }),
    metric("rent", "Base rent", mode === "wrong-price" ? 999 : item("rent"), "usd/month"), metric("total", "Monthly total", item("costs/monthlyTotal"), "usd/month"),
    metric("beds", "Bedrooms", item("bedrooms")), metric("baths", "Bathrooms", item("bathrooms")), metric("area", "Area", item("sqft"), "sqft"),
    node("image", "Image", { src: item("imageUrl"), alt: "Synthetic fixture image" }),
    node("details", "Text", { content: item("fixtureFacts") }),
  ];
  if (task.case.id === "C04") {
    content.push(node("photo2", "Image", { src: item("photos/1/url"), alt: "Synthetic fixture image 2" }), node("photo3", "Image", { src: item("photos/2/url"), alt: "Synthetic fixture image 3" }));
  }
  for (const action of task.case.expected.actions.filter((a: string) => a !== "back_to_results")) {
    const id = node(action, "Button", { label: action === "view_apartment" ? "View Details" : "Schedule Tour" });
    elements[id].on = { press: { action, params: { apartmentId: mode === "wrong-action" ? "999" : { $template: "${id}" } } } };
    content.push(id);
  }
  node("card", "Card", { recordId: item("id") }, content);
  node("grid", "Grid", { columns: task.case.id === "C02" ? "3" : "1" }, ["card"]);
  elements.grid.repeat = { statePath: "/apartments", key: "id" };
  const children = ["grid"];
  if (task.case.expected.actions.includes("back_to_results")) {
    node("back", "Button", { label: "Back to Results" });
    elements.back.on = { press: { action: "back_to_results", params: {} } };
    children.push("back");
  }
  node("root", "Stack", {}, children);
  if (task.case.id === "C04") {
    // The record legitimately spans multiple cards/sections. Catch overly narrow DOM scopes.
    elements.card.children = elements.card.children.filter((id: string) => !["image", "photo2", "photo3", "details"].includes(id));
    node("more-details", "Stack", {}, ["image", "photo2", "photo3", "details"]);
    node("details-repeat", "Grid", { columns: "1" }, ["more-details"]);
    elements["details-repeat"].repeat = { statePath: "/apartments", key: "id" };
    children.splice(1, 0, "details-repeat");
  }
  const patches: any[] = [{ op: "add", path: "/root", value: "root" }, ...Object.entries(elements).map(([id, value]) => ({ op: "add", path: `/elements/${id}`, value })), { op: "add", path: "/state", value: { apartments: [] } }];
  task.records.forEach((record: any, i: number) => patches.push({ op: "add", path: `/state/apartments/${i}`, value: {
    ...record,
    fixtureFacts: [record.description, record.petPolicy, record.petRules.maxWeightLbs === null ? "" : `${record.petRules.maxWeightLbs} pounds`, ...record.fees.map((f: any) => `${f.label}: ${f.amount === null ? "Unknown" : f.amount}; ${f.required ? "required" : "optional"} ${f.frequency}`), `Move-in total ${record.costs.moveInTotal ?? "Unknown"}`, `Available ${record.availableFrom ?? "Unknown"}`, `Lease ${record.leaseMonths.join(", ")} months`, `Floor ${record.floor}; ${record.elevator ? "Elevator" : "No elevator"}`, ...record.amenities, ...record.transit.map((t: any) => `${t.name}: ${t.walkMinutes} minutes`), ...record.reviews.map((r: any) => `${r.author}: ${r.rating}/5. ${r.text}`)].join(". "),
  } }));
  const lines = patches.map((p) => JSON.stringify(p));
  if (mode === "malformed") lines.push('{"op":"add","path":"/elements/broken"');
  return lines;
}
