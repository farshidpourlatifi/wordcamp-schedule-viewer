import { decodeEntities, toPlainText } from "@/utils/decodeEntities";
import {
  namedEntityTitleRecord,
  numericEntityTitleRecord,
} from "@/test/wordcamps.fixtures";

describe("decodeEntities", () => {
  it("decodes named entities", () => {
    expect(decodeEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(decodeEntities("a &lt; b &gt; c")).toBe("a < b > c");
    expect(decodeEntities("&quot;quoted&quot;")).toBe('"quoted"');
    expect(decodeEntities("it&apos;s")).toBe("it's");
  });

  it("decodes every named entity in the table", () => {
    // One assertion per row of NAMED_ENTITIES, so a wrong or dropped mapping
    // fails here rather than passing unnoticed on the untested rows.
    const cases = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
      "&#039;": "'",
      "&nbsp;": " ",
      "&ndash;": "–",
      "&mdash;": "—",
      "&hellip;": "…",
      "&lsquo;": "‘",
      "&rsquo;": "’",
      "&ldquo;": "“",
      "&rdquo;": "”",
      "&laquo;": "«",
      "&raquo;": "»",
      "&eacute;": "é",
      "&times;": "×",
      "&middot;": "·",
      "&deg;": "°",
    };

    for (const [entity, char] of Object.entries(cases)) {
      expect(decodeEntities(`x${entity}y`)).toBe(`x${char}y`);
    }
  });

  it("accepts an uppercase X in a hex entity", () => {
    // Case-insensitive by design: the API has emitted both &#x…; and &#X…;.
    expect(decodeEntities("&#X2014;")).toBe("—");
  });

  it("decodes decimal and hexadecimal numeric entities", () => {
    // &#8211; (en dash) is the entity the WordCamp API emits most often.
    expect(decodeEntities("WordCamp &#8211; Europe")).toBe("WordCamp – Europe");
    expect(decodeEntities("caf&#233;")).toBe("café");
    expect(decodeEntities("caf&#xE9;")).toBe("café");
    expect(decodeEntities("&#x2014;")).toBe("—");
  });

  it("decodes a non-breaking space to a normal space", () => {
    // A literal U+00A0 would survive into the DOM and break text wrapping.
    expect(decodeEntities("Rome&nbsp;2026")).toBe("Rome 2026");
  });

  it("decodes each entity exactly once, so double-encoded input is safe", () => {
    // Decoding "&amp;" then rescanning would turn "&amp;#8211;" into an en
    // dash, silently corrupting a title that legitimately displays "&#8211;".
    expect(decodeEntities("&amp;#8211;")).toBe("&#8211;");
    expect(decodeEntities("&amp;amp;")).toBe("&amp;");
  });

  it("leaves unknown entities and bare ampersands untouched", () => {
    expect(decodeEntities("&notarealentity;")).toBe("&notarealentity;");
    expect(decodeEntities("Q&A")).toBe("Q&A");
    expect(decodeEntities("100% & rising")).toBe("100% & rising");
  });

  it("rejects out-of-range code points rather than throwing", () => {
    expect(decodeEntities("&#1114112;")).toBe("&#1114112;");
    expect(decodeEntities("&#x110000;")).toBe("&#x110000;");
  });

  it("returns an empty string for missing or non-string input", () => {
    expect(decodeEntities("")).toBe("");
    expect(decodeEntities(null)).toBe("");
    expect(decodeEntities(undefined)).toBe("");
    expect(decodeEntities(42)).toBe("");
  });

  it("decodes the entity-bearing titles in the real API fixtures", () => {
    expect(decodeEntities(namedEntityTitleRecord.title.rendered)).toBe(
      "WordPress Campus Connect Pundra University of Science & Technology, Bogura",
    );
    expect(decodeEntities(numericEntityTitleRecord.title.rendered)).toBe(
      "WordPress Campus Connect St. Edward’s S.S Bukuumi",
    );
  });
});

describe("toPlainText", () => {
  it("strips HTML tags and decodes what remains", () => {
    expect(toPlainText("<em>WordCamp</em> &amp; friends")).toBe(
      "WordCamp & friends",
    );
  });

  it("strips tags BEFORE decoding, so escaped markup stays inert text", () => {
    // Order is the whole security argument. Decoding first would turn
    // "&lt;script&gt;" into a real tag that the strip pass would then delete,
    // silently discarding content. Stripping first preserves it as literal
    // text, which React escapes on render.
    expect(toPlainText("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe(
      "<script>alert(1)</script>",
    );
  });

  it("removes a real injected tag entirely", () => {
    // A tag becomes a space rather than nothing, so block-level markup like
    // "<p>a</p><p>b</p>" cannot fuse two words into "ab".
    expect(toPlainText("<script>alert(1)</script>Rome")).toBe("alert(1) Rome");
    expect(toPlainText("<img src=x onerror=alert(1)>")).toBe("");
    expect(toPlainText("<p>Rome</p><p>2026</p>")).toBe("Rome 2026");
  });

  it("never returns a string containing an HTML tag", () => {
    // The invariant the rest of the app depends on: output is text, and is
    // rendered as React children — never via dangerouslySetInnerHTML.
    const hostile = "<b>bold</b><i>x</i><a href='#'>link</a>";
    expect(toPlainText(hostile)).toBe("bold x link");
    expect(toPlainText(hostile)).not.toMatch(/<[^>]*>/);
  });

  it("strips an unterminated tag rather than leaking it", () => {
    expect(toPlainText("Rome <script")).toBe("Rome");
  });

  it("collapses whitespace left behind by stripped markup", () => {
    expect(toPlainText("  WordCamp   Rome  ")).toBe("WordCamp Rome");
    expect(toPlainText("Rome<br />\n2026")).toBe("Rome 2026");
  });

  it("returns an empty string for missing input", () => {
    expect(toPlainText(null)).toBe("");
    expect(toPlainText("")).toBe("");
  });
});
