// Hand-authored UI fixtures, shared only by replay serializers. The fact oracle
// does not import this file. These trees never produce a live model response.
export type Node = { type: string; props: any; children?: Node[]; action?: any };
export function replayTree(task: any, control = "valid"): Node {
  const n = (type: string, props: any = {}, children?: Node[]): Node => ({ type, props, ...(children ? { children } : {}) });
  const text = (content: string) => n("Text", { content });
  const metric = (label: string, value: any, format = "text") => n("Metric", { label, value, format });
  const button = (label: string, name: string, id?: string) => ({ ...n("Button", { label, variant: name === "back_to_results" ? "ghost" : "secondary", type: "button" }), action: { name, ...(id ? { apartmentId: id } : {}) } });
  const back = () => button("Back to Results", "back_to_results");
  const photo = (url: string) => n("Image", { src: url, alt: "Illustrative apartment interior" });
  const heading = (title: string, level = "h3") => n("Heading", { text: title, level });
  const view = task.case.expected.view;
  let children: Node[];
  if (view === "empty") {
    children = [heading("No matching apartments", "h2"), text("No apartments have base rent strictly below $1,000. Try increasing your budget.")];
    if (control === "hallucinated-record") children.push(n("Card", { recordId: task.otherRecords[0].id }, [heading(task.otherRecords[0].title), text("Available now")]));
    if (control === "unexpected-action") children.push(button("Schedule Tour", "schedule_tour", "999"));
  } else if (view === "form") {
    const record = task.records[0];
    const input = (name: string, label: string, type = "text") => n("Input", { name, label, type, required: !(control === "missing-required" && name === "email"), placeholder: "", defaultValue: "", min: type === "date" ? "2026-11-02" : "", max: "" });
    children = [n("Card", { recordId: record.id, padding: "md" }, [heading(record.title), n("Form", { apartmentId: control === "wrong-form-target" ? "999" : record.id, label: "Demo tour request" }, [
      input("name", "Name"), input("email", "Email", "email"), input("date", "Preferred date", "date"), input("phone", "Phone", "tel"),
      n("Select", { name: "tourType", label: "Tour format", required: true, defaultValue: "", options: [{ value: "in-person", label: "In person" }, { value: "video", label: "Video" }] }),
      n("Textarea", { name: "message", label: "Message", required: false, placeholder: "", defaultValue: "" }),
      n("Checkbox", { name: "bringPet", label: "Discuss a pet", required: false, defaultChecked: false }),
      n("Button", { label: "Submit Demo Request", variant: "primary", type: "submit" }),
    ])]), back()];
  } else {
    const cards = task.records.map((record: any) => {
      const body = [n("Badge", { text: record.neighborhood }), heading(record.title), metric("Monthly total", record.costs.monthlyTotal, "usd/month")];
      if (record.costs.monthlyTotal === null) body.push(metric("Known monthly subtotal", record.costs.knownMonthlySubtotal, "usd/month"), text("Mandatory fees are unknown; this subtotal is incomplete."));
      body.push(metric("Base rent", control === "wrong-price" ? 1 : record.rent, "usd/month"), n("Row", {}, [metric("Bedrooms", record.bedrooms), ...(control === "missing-field" ? [] : [metric("Bathrooms", record.bathrooms)]), metric("Area", record.sqft, "sqft")]));
      if (view === "detail" || view === "comparison") {
        const fees = view === "detail" ? record.fees : record.fees.filter((f: any) => f.required && f.frequency === "monthly");
        body.push(n("List", {}, fees.map((f: any, i: number) => n("ListItem", {}, [text(`${f.label}: ${control === "wrong-fee" && i === 0 ? "$1" : f.amount === null ? "Unknown" : "$" + f.amount}; ${f.required ? "required" : "optional"}; ${f.frequency}`)]))));
        body.push(text(record.petPolicy + (record.petRules.maxWeightLbs == null ? "" : `; ${record.petRules.maxWeightLbs} lb weight limit`)), n("List", {}, record.transit.map((t: any) => n("ListItem", {}, [text(`${t.name}: ${t.walkMinutes} minutes`)]))));
      }
      if (view === "detail") body.push(text(record.description), metric("Move-in total", record.costs.moveInTotal, "usd"), text(`Availability: ${record.availableFrom ?? "Unknown"}. Lease: ${record.leaseMonths.join(", ")} months. Floor: ${record.floor}. ${record.elevator ? "Elevator" : "No elevator"}.`), n("List", {}, record.amenities.map((a: string) => n("ListItem", {}, [text(a)]))), n("List", {}, record.reviews.map((review: any) => n("ListItem", {}, [text(`${review.author}: ${review.rating}/5. ${review.text}`)]))));
      const buttons = task.case.expected.actions.filter((a: string) => a !== "back_to_results").map((name: string) => button(name === "view_apartment" ? "View Details" : "Schedule Tour", name, control === "wrong-action" ? "999" : record.id));
      if (control === "dead-action" && buttons[0]) buttons[0].props.type = "submit"; // Valid schema, inert outside a form.
      body.push(n("Row", {}, buttons));
      const photos = view === "detail" ? n("Grid", { columns: "1" }, record.photos.slice(0, 3).map((p: any) => photo(p.url))) : photo(record.imageUrl);
      return n("Card", { recordId: record.id }, [n("Grid", { columns: view === "comparison" ? "1" : "2", gap: "sm" }, [photos, n("Stack", { padding: "md" }, body)])]);
    });
    children = [heading(view === "comparison" ? "Compare apartments" : view === "detail" ? "Apartment details" : "Apartments", "h2"), n("Grid", { columns: view === "comparison" ? "3" : "1" }, cards)];
    if (task.case.expected.actions.includes("back_to_results")) children.push(back());
  }
  if (control === "invalid-component") children[0].type = "InventedComponent";
  return n("Stack", { padding: "none" }, children);
}
