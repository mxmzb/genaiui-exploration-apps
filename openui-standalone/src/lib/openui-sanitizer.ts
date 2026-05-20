/**
 * Deterministic sanitizer for OpenUI Lang output. Fixes known classes of
 * LLM generation errors before the text reaches the Renderer.
 */

const METHOD_CALL_PATTERN = /\.(?:toLocaleString|toString|toFixed|valueOf|toPrecision|toExponential|trim|toLowerCase|toUpperCase|charAt|slice|substring|split|join|map|filter|reduce|forEach|indexOf|includes|replace|match|padStart|padEnd)\s*\([^)]*\)/g;

/**
 * Find the closing paren that matches the opening paren at `start`.
 * Returns the index of the closing `)`, or -1 if not found.
 */
function findMatchingParen(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\" && i + 1 < text.length) {
        i++;
        continue;
      }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Strips redundant nested @Each calls. When an outer @Each binds a variable
 * (e.g. @Each(data, "apt", ...)), any inner @Each with the same source and
 * iterator is redundant — `apt` is already bound. The inner @Each just causes
 * N×N rendering. This function replaces inner @Each(source, "var", EXPR) with
 * just EXPR.
 */
function stripNestedEach(text: string): string {
  const eachPattern = /@Each\s*\(/g;
  let match: RegExpExecArray | null;

  // Collect all @Each positions with their source and iterator
  interface EachInfo {
    fullStart: number;
    fullEnd: number;
    source: string;
    iterator: string;
    bodyStart: number;
    bodyEnd: number;
  }

  const eachCalls: EachInfo[] = [];
  const workingText = text;

  while ((match = eachPattern.exec(workingText)) !== null) {
    const eachStart = match.index;
    const parenStart = eachStart + match[0].length - 1;
    const parenEnd = findMatchingParen(workingText, parenStart);
    if (parenEnd === -1) continue;

    const inner = workingText.slice(parenStart + 1, parenEnd);

    // Parse: source, "iterator", body
    // Find source (first arg before comma)
    const firstComma = inner.indexOf(",");
    if (firstComma === -1) continue;
    const source = inner.slice(0, firstComma).trim();

    // Find iterator (quoted string after first comma)
    const afterFirst = inner.slice(firstComma + 1).trimStart();
    const iterMatch = afterFirst.match(/^"([^"]+)"\s*,\s*/);
    if (!iterMatch) continue;
    const iterator = iterMatch[1];
    const bodyOffset = firstComma + 1 + (afterFirst.length - afterFirst.trimStart().length) + iterMatch[0].length;
    const bodyStart = parenStart + 1 + bodyOffset;
    const bodyEnd = parenEnd;

    eachCalls.push({
      fullStart: eachStart,
      fullEnd: parenEnd + 1,
      source,
      iterator,
      bodyStart,
      bodyEnd,
    });
  }

  if (eachCalls.length < 2) return text;

  // Find redundant inner @Each calls: same source AND same iterator,
  // and contained within another @Each's body range
  const toReplace: { start: number; end: number; replacement: string }[] = [];

  for (const inner of eachCalls) {
    for (const outer of eachCalls) {
      if (inner === outer) continue;
      if (
        inner.source === outer.source &&
        inner.iterator === outer.iterator &&
        inner.fullStart >= outer.bodyStart &&
        inner.fullEnd <= outer.bodyEnd
      ) {
        // inner is nested inside outer with same source+iterator — redundant
        const body = text.slice(inner.bodyStart, inner.bodyEnd);
        toReplace.push({
          start: inner.fullStart,
          end: inner.fullEnd,
          replacement: body,
        });
      }
    }
  }

  if (toReplace.length === 0) return text;

  // Apply replacements from end to start to preserve indices
  toReplace.sort((a, b) => b.start - a.start);
  let result = text;
  for (const { start, end, replacement } of toReplace) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return result;
}

/**
 * Removes top-level statements of the form `name = @Each(...)`.
 * A standalone @Each assignment is never correct — @Each should always be
 * inline as a child of a container (CardGrid, Stack, etc.). When the LLM
 * defines `rentText = @Each(data, "apt", TextContent(apt.rent))` and then
 * references `rentText(apt)` inside another @Each, it thinks it's creating
 * a reusable template — but OpenUI Lang has no macro system. The @Each
 * evaluates immediately into N elements, and the reference fails.
 * Removing these statements causes the dangling references to resolve to
 * null (invisible), which is better than N×N duplication.
 */
function stripStandaloneEachAssignments(text: string): string {
  return text.replace(/^\s*\w+\s*=\s*@Each\s*\(.*$/gm, "");
}

export function sanitizeOpenUIOutput(text: string): string {
  let result = text;
  result = result.replace(METHOD_CALL_PATTERN, "");
  result = stripNestedEach(result);
  result = stripStandaloneEachAssignments(result);
  return result;
}
