// The oracle stays in the evaluator. Only the case prompt and selected records reach the model.
export const normalize = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const imageKey = (value: string) => { try { const url = new URL(value); return url.origin + url.pathname; } catch { return value; } };

export function checkRecord(record: any, actual: any, fields: string[]) {
  const errors: string[] = [];
  const text = normalize(actual.text);
  const has = (value: unknown) => text.includes(normalize(value));
  const need = (ok: boolean, label: string) => { if (!ok) errors.push(`${record.id}: ${label}`); };
  const metric = (labels: RegExp, expected: unknown, name: string) => {
    const found = actual.metrics.filter((m: any) => labels.test(m.label.toLowerCase()));
    const valid = found.length > 0 && found.every((m: any) => expected === null
      ? /unknown|incomplete|not known/i.test(m.value)
      : Number(m.value.replace(/[^\d.\-]/g, "")) === expected);
    need(valid, `incorrect or missing ${name}`);
  };
  need(has(record.title), "missing title");
  if (fields.includes("neighborhood")) need(has(record.neighborhood), "missing neighborhood");
  if (fields.includes("imageUrl")) need(actual.images.some((i: any) => imageKey(i.src) === imageKey(record.imageUrl)), "missing listing image");
  if (fields.includes("rent")) metric(/base rent|^rent$/, record.rent, "rent");
  if (fields.includes("costs")) metric(/monthly total|total monthly|monthly cost/, record.costs.monthlyTotal, "monthly total");
  if (fields.includes("costs") && record.costs.monthlyTotal === null) {
    metric(/subtotal/, record.costs.knownMonthlySubtotal, "known subtotal");
    need(/unknown|notyetknown|incomplete/.test(text), "missing unknown-fee explanation");
  }
  if (fields.includes("bedrooms")) metric(/bed/, record.bedrooms, "bedrooms");
  if (fields.includes("bathrooms")) metric(/bath/, record.bathrooms, "bathrooms");
  if (fields.includes("sqft")) metric(/area|sqft|size|square/, record.sqft, "area");
  if (fields.includes("photos")) {
    for (const photo of record.photos.slice(0, 3)) need(actual.images.some((i: any) => imageKey(i.src) === imageKey(photo.url)), "missing gallery photo");
  }
  if (fields.includes("fees")) {
    const fees = fields.includes("photos") ? record.fees : record.fees.filter((f: any) => f.required && f.frequency === "monthly");
    const labelKey = (label: string) => normalize(label.replace(/optional|refundable|if bringing a pet/gi, ""));
    const amountsIn = (text: string, value: number | null) => value === null ? /unknown|incomplete/i.test(text) : (text.replaceAll(",", "").match(/\d+(?:\.\d+)?/g) ?? []).some((n) => Number(n) === value);
    const lines = actual.text.split(/\n+|\.\s+|;\s*/).map((line: string) => line.trim()).filter(Boolean);
    const segments = [...lines.map((line: string, i: number) => line + (!/\d/.test(line) && /^(?:\$?\d|unknown)/i.test(lines[i + 1] ?? "") ? " " + lines[i + 1] : "")), ...actual.metrics.map((m: any) => `${m.label} ${m.value}`), ...(actual.feeRows ?? [])];
    const aggregate = !fields.includes("photos") && fees.every((f: any) => f.amount !== null) && actual.metrics.some((m: any) => /mandatory.*fees|required.*fees/i.test(m.label) && Number(m.value.replace(/[^\d.\-]/g, "")) === fees.reduce((sum: number, f: any) => sum + f.amount, 0));
    for (const fee of fees) need(aggregate || segments.some((s: string) => labelKey(s).includes(labelKey(fee.label)) && amountsIn(s, fee.amount)), `missing fee ${fee.label} or its amount`);
    if (record.costs.monthlyTotal !== null && fields.includes("photos")) metric(/move.?in total/, record.costs.moveInTotal, "move-in total");
  }
  if (fields.includes("petPolicy")) need(text.replaceAll("allowed", "").includes(normalize(record.petPolicy)), "pet policy requires review or is missing");
  if (fields.includes("petRules") && record.petRules.maxWeightLbs !== null) need(has(record.petRules.maxWeightLbs) && /lb|pound/.test(text), "missing pet weight limit");
  if (fields.includes("transit")) for (const transit of record.transit) need(has(transit.name) && has(transit.walkMinutes), `missing transit ${transit.name}`);
  if (fields.includes("amenities")) for (const amenity of record.amenities) need(has(amenity), `missing amenity ${amenity}`);
  if (fields.includes("leaseMonths")) need(record.leaseMonths.every((n: number) => has(n)) && /lease|month/.test(text), "missing lease terms");
  if (fields.includes("floor")) need(has(record.floor) && /floor|storey|story/.test(text), "missing floor");
  if (fields.includes("elevator")) need(record.elevator ? /elevator|lift/.test(text) && !/noelevator|nolift|elevatorno|elevatoraccessno/.test(text) : /noelevator|nolift|walkup/.test(text), "missing elevator status");
  if (fields.includes("availableFrom")) {
    const date = new Date(`${record.availableFrom}T12:00:00Z`);
    const variants = [record.availableFrom, date.toLocaleDateString("en-US", {month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}), date.toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})];
    need(record.availableFrom === null ? /unknown|notknown/.test(text) : variants.some(has), "availability requires review or is missing");
  }
  if (fields.includes("reviews")) for (const review of record.reviews) need(has(review.author) && has(review.rating), `missing review attribution/rating for ${review.author}`);
  return errors;
}

export function inspectDOM(task: any) {
  const root = document.querySelector(".generated-ui");
  if (!root || !task) return { meaningful: false, ready: false, recordIds: [], enabledButtons: 0, errors: ["No generated view"], records: [], buttons: [] };
  const visible = (node: Element) => {
    const style = getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
  };
  const headings = [...root.querySelectorAll("h2,h3,h4")].filter(visible);
  const records = task.records.map((record: any) => {
    const heading = headings.find((h) => normalize(h.textContent) === normalize(record.title));
    const scope = task.records.length === 1 ? root : heading?.closest(".ui-card");
    return { id: record.id, scope, heading };
  });
  const snapshots = records.map(({ id, scope, heading }: any) => ({
    id, found: !!heading && !!scope,
    text: scope ? (scope as HTMLElement).innerText : "",
    metrics: scope ? [...scope.querySelectorAll(".ui-metric")].filter(visible).map((m: any) => ({ label: m.querySelector("span")?.textContent ?? "", value: m.querySelector("strong")?.textContent ?? "" })) : [],
    images: scope ? [...scope.querySelectorAll("img")].filter(visible).map((i: any) => ({ src: i.src, loaded: i.complete && i.naturalWidth > 0 })) : [],
    feeRows: scope ? [...scope.querySelectorAll(".ui-row")].filter((r: any) => visible(r) && r.querySelectorAll(".ui-metric").length === 1).map((r: any) => r.innerText) : [],
  }));
  const ids = headings.flatMap((h) => task.records.filter((r: any) => normalize(r.title) === normalize(h.textContent)).map((r: any) => r.id));
  const uniqueIds = [...new Set(ids)];
  const buttons = [...root.querySelectorAll("button")].filter(visible).map((button: any) => ({
    label: button.innerText, enabled: !button.matches(":disabled"),
    scopeId: records.find((r: any) => r.scope !== root && r.scope?.contains(button))?.id ?? (task.records.length === 1 ? task.records[0].id : null),
  }));
  const errors = snapshots.flatMap((actual: any, i: number) => actual.found ? checkRecord(task.records[i], actual, task.case.expected.fields) : [`${actual.id}: missing record scope/title`]);
  const rootText = (root as HTMLElement).innerText;
  for (const extra of task.otherRecords) if (normalize(rootText).includes(normalize(extra.title))) errors.push(`extra listing ${extra.id}`);
  if (task.case.expected.ordered && JSON.stringify(uniqueIds) !== JSON.stringify(task.case.expected.listing_ids)) errors.push("wrong listing order");
  if (ids.length !== uniqueIds.length) errors.push("duplicate listing headings require review");
  const form = inspectForm(root, task.case.expected.form);
  errors.push(...form.errors);
  if (task.case.expected.view === "empty") errors.push(...checkEmptyView(rootText, buttons));
  const enabledButtons = buttons.filter((b) => b.enabled).length;
  const minButtons = task.case.expected.actions.reduce((n: number, a: string) => n + (a === "back_to_results" ? 1 : task.records.length), 0);
  let meaningful = records.some(({ scope, heading }: any, i: number) => {
    if (!heading || !scope || !snapshots[i].metrics.some((m: any) => /\d/.test(m.value))) return false;
    const box = heading.getBoundingClientRect();
    const metricOnScreen = [...scope.querySelectorAll(".ui-metric strong")].some((m: any) => {
      const b = m.getBoundingClientRect();
      return /\d/.test(m.textContent) && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
    });
    return metricOnScreen && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
  });
  if (task.case.expected.view === "empty") meaningful = errors.length === 0 && rootText.trim().length > 0;
  if (task.case.expected.view === "form") meaningful = snapshots.some((r: any) => r.found) && form.fields.some((f: any) => f.visible);
  return { form, meaningful, ready: errors.length === 0 && enabledButtons >= minButtons && !document.querySelector('[role="alert"]'), recordIds: uniqueIds, enabledButtons, errors, records: snapshots, buttons };
}

export function checkEmptyView(text: string, buttons: any[]) {
  const errors: string[] = [];
  if (!/no (?:matching |available |affordable )?(?:apartments|listings|results|homes)|nothing (?:matches|available)|could(?:n't| not) find|zero (?:results|matches)/i.test(text)) errors.push("Empty view does not explain no matches");
  if (!/1,?000/.test(text) || !/budget|rent|price|below|under/i.test(text)) errors.push("Empty view omits the unmet budget constraint");
  if (!/increas|rais|higher|relax|adjust|broaden|expand/i.test(text)) errors.push("Empty view does not suggest relaxing the constraint");
  if (buttons.length) errors.push("Unexpected action in empty view");
  return errors;
}
export function inspectForm(root: Element, expected: any) {
  if (!expected) return { errors: [] as string[], fields: [] as any[] };
  const forms = [...root.querySelectorAll("form")];
  const errors: string[] = [];
  if (forms.length !== 1) errors.push(`Expected one generated form, found ${forms.length}`);
  const fields = [...(forms[0]?.querySelectorAll("input,select,textarea") ?? [])].map((el: any) => ({ name: el.name, type: el.type, tag: el.tagName.toLowerCase(), required: el.required, label: [...(el.labels ?? [])].map((l: any) => l.textContent).join(" ").trim(), visible: el.getClientRects().length > 0, options: el.tagName === "SELECT" ? [...el.options].map((o: any) => o.value).filter(Boolean) : [], min: el.min, value: el.value }));
  for (const name of [...expected.required, ...expected.optional]) {
    const found = fields.filter(f => f.name === name);
    if (found.length !== 1) { errors.push(`Missing/duplicate field ${name}`); continue; }
    const f = found[0];
    if (!f.visible || !f.label) errors.push(`Field ${name} is hidden or unlabeled`);
    if (f.required !== expected.required.includes(name)) errors.push(`Incorrect required state for ${name}`);
    if (name === "email" && f.type !== expected.email_type) errors.push("Email input is not type=email");
    if (name === "date" && f.type !== expected.date_type) errors.push("Date input is not type=date");
    if (expected.checkboxes.includes(name) && f.type !== "checkbox") errors.push(`${name} is not a checkbox`);
    if (expected.select_options[name] && JSON.stringify([...f.options].sort()) !== JSON.stringify([...expected.select_options[name]].sort())) errors.push(`Incorrect options for ${name}`);
  }
  if (!forms[0]?.querySelector('button[type="submit"]')) errors.push("Missing native submit button");
  return { errors, fields };
}
