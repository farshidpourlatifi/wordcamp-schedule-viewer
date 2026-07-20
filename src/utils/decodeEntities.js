/**
 * HTML entity decoding for API-supplied text.
 *
 * WordCamp titles arrive HTML-rendered (`title.rendered`), so "WordCamp
 * Europe – Rome" comes back as "WordCamp Europe &#8211; Rome".
 *
 * Deliberately implemented WITHOUT the DOM. The usual tricks for this
 * (`textarea.innerHTML = input`, `DOMParser`) all route untrusted API text
 * through an HTML parser, which is exactly the sink we want to keep it away
 * from. A pure string transform is safe, synchronous, and testable in isolation
 * with no jsdom involved.
 *
 * Output is always plain TEXT and is rendered as React children — never
 * through `dangerouslySetInnerHTML`.
 */

/**
 * Named entities WordPress actually emits in post titles. Deliberately short:
 * an unknown entity is left verbatim rather than guessed at.
 */
const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ", // normal space, not U+00A0 — a hard space breaks text wrapping.
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  eacute: "é",
  times: "×",
  middot: "·",
  deg: "°",
};

/** Highest code point Unicode defines; anything above is not representable. */
const MAX_CODE_POINT = 0x10ffff;

/**
 * Matches one entity: decimal (`&#8211;`), hex (`&#x2014;`), or named
 * (`&amp;`). A single pass over the input handles all three, which is what
 * keeps decoding idempotent — see the double-encoding note in `decodeEntities`.
 */
const ENTITY_PATTERN = /&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;

/**
 * Resolve one numeric entity body (`#8211` or `#x2014`) to its character.
 * Returns null when the code point is out of range, so the caller can leave
 * the original text alone instead of throwing.
 */
function decodeNumericEntity(body) {
  const isHex = body[1] === "x" || body[1] === "X";
  const codePoint = isHex
    ? parseInt(body.slice(2), 16)
    : parseInt(body.slice(1), 10);

  if (!Number.isFinite(codePoint) || codePoint > MAX_CODE_POINT) return null;

  return String.fromCodePoint(codePoint);
}

/**
 * Decode HTML entities in a string.
 *
 * Every entity is decoded exactly once, in one left-to-right pass. This
 * matters: decoding `&` first and then rescanning would turn the input
 * `&amp;#8211;` — a title that legitimately wants to display the text
 * "&#8211;" — into an en dash.
 *
 * @param {string} input Possibly entity-encoded text.
 * @returns {string} Decoded text; empty string for non-string input.
 */
export function decodeEntities(input) {
  if (typeof input !== "string" || input === "") return "";

  return input.replace(ENTITY_PATTERN, (match, body) => {
    if (body[0] === "#") {
      return decodeNumericEntity(body) ?? match;
    }
    // Unknown named entity: leave it exactly as written.
    return NAMED_ENTITIES[body] ?? match;
  });
}

/** Matches an HTML tag, including unclosed ones at end of input. */
const TAG_PATTERN = /<[^>]*>?/g;

/**
 * Convert API-supplied HTML to display-ready plain text.
 *
 * Tags are stripped BEFORE entities are decoded, and the order is the whole
 * safety argument: decoding first would turn `&lt;script&gt;` into a real tag
 * that the strip pass would then delete, silently destroying content the title
 * meant to show. Stripping first leaves it as inert literal text.
 *
 * @param {string} input Possibly HTML-bearing text.
 * @returns {string} Whitespace-collapsed plain text.
 */
export function toPlainText(input) {
  if (typeof input !== "string" || input === "") return "";

  const withoutTags = input.replace(TAG_PATTERN, " ");

  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}
