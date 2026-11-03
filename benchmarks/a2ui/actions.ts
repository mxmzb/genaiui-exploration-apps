// Independent structural check. Actual click dispatch is a separate browser smoke
// check; this never claims that a syntactically valid action has been clicked.
export function checkActionBindings(operations: any[], task: any) {
  let data: any = {},
    nodes = new Map<string, any>();
  for (const op of operations) {
    if (op.createSurface) {
      data = structuredClone(op.createSurface.dataModel ?? {});
      nodes = new Map(op.createSurface.components.map((n: any) => [n.id, n]));
    }
    if (op.updateComponents)
      for (const n of op.updateComponents.components) nodes.set(n.id, n);
    if (op.updateDataModel) {
      const { path, value } = op.updateDataModel;
      if (!path || path === "/") {
        data = structuredClone(value);
        continue;
      }
      const keys = path.slice(1).split("/");
      let at = data;
      for (let i = 0; i < keys.length - 1; i++)
        at = at[keys[i]] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
      if (value === null) delete at[keys.at(-1)!];
      else at[keys.at(-1)!] = structuredClone(value);
    }
  }
  const get = (obj: any, path: string) =>
    path
      .split("/")
      .filter(Boolean)
      .reduce((o, k) => o?.[k], obj);
  const resolve = (v: any, scope: any): any =>
    v && typeof v === "object" && "@path" in v
      ? get(v["@path"].startsWith("/") ? data : scope, v["@path"])
      : v;
  const actual: any[] = [],
    errors: string[] = [];
  function walk(
    id: string,
    scope: any,
    recordId?: string,
    trail: string[] = [],
  ) {
    if (trail.includes(id)) {
      errors.push(`Component cycle at ${id}`);
      return;
    }
    const n = nodes.get(id);
    if (!n) {
      errors.push(`Missing component ${id}`);
      return;
    }
    const owner =
      n.component === "Card"
        ? (resolve(n.recordId, scope) ?? recordId)
        : recordId;
    if (n.component === "Button" && n.type !== "submit") {
      const e = n.onClick?.event,
        apartmentId = resolve(e?.context?.apartmentId, scope);
      actual.push({ name: e?.name, apartmentId, scopeId: owner });
      if (e?.name !== "back_to_results" && apartmentId !== owner)
        errors.push(
          `Action target ${apartmentId} does not match its card ${owner}`,
        );
    }
    if (n.component === "Form") {
      const e = n.onSubmit?.event;
      actual.push({ name: e?.name, apartmentId: resolve(n.apartmentId, scope), scopeId: owner });
    }
    const children = n.children;
    if (Array.isArray(children))
      children.forEach((c) => walk(c, scope, owner, [...trail, id]));
    else if (children?.componentId) {
      const list = get(
        children.path?.startsWith("/") ? data : scope,
        children.path ?? "",
      );
      if (!Array.isArray(list))
        errors.push(`Missing template data ${children.path}`);
      else
        list.forEach((item) =>
          walk(children.componentId, item, owner, [...trail, id]),
        );
    }
  }
  walk("root", data);
  const expected = task.case.expected.actions.flatMap((name: string) =>
    name === "back_to_results"
      ? [{ name, apartmentId: undefined }]
      : task.records.map((r: any) => ({ name, apartmentId: r.id })),
  );
  for (const wanted of expected)
    if (
      actual.filter(
        (a) => a.name === wanted.name && a.apartmentId === wanted.apartmentId,
      ).length !== 1
    )
      errors.push(
        `Missing/duplicate action ${wanted.name}:${wanted.apartmentId ?? "results"}`,
      );
  for (const found of actual)
    if (
      !expected.some(
        (e: any) =>
          e.name === found.name && e.apartmentId === found.apartmentId,
      )
    )
      errors.push(`Unexpected action ${found.name}:${found.apartmentId}`);
  return { pass: !errors.length, errors, actual };
}
