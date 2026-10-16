import assert from "node:assert/strict";
import { test } from "node:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { notesToMarkdown } from "../src/lib/workspace/notes-markdown.ts";
import type { Note } from "../src/lib/workspace/notes.ts";
import type { Highlight } from "../src/lib/markdown/dom-highlighter.ts";

const note = (id: string, content: string, createdAt: number): Note => ({
  id,
  fileId: id,
  fileName: "original.md",
  content,
  source: { quote: content, sectionTitle: "A section" },
  createdAt,
  updatedAt: createdAt,
});

test("merges content in card order without generated headings, metadata, or separators", () => {
  const markdown = notesToMarkdown(
    [
      note("older", "    indented code", 1),
      note("newer", "**Bold**\n\n- Task\n\n$$x^2$$\n\n```mermaid\ngraph TD\nA --> B\n```", 3),
    ],
    [
      {
        id: "h",
        fileId: "newer",
        text: "A *literal* $price$ <tag>",
        label: "[label]",
        color: "yellow",
        createdAt: 2,
      },
    ],
  );
  assert.equal(
    markdown,
    "**Bold**\n\n- Task\n\n$$x^2$$\n\n```mermaid\ngraph TD\nA --> B\n```\n\nA \\*literal\\* \\$price\\$ \\<tag\\>\n\n    indented code\n",
  );
  // A highlight is rendered text; markup-looking characters stay literal.
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(markdown);
  const literal = tree.children.find(
    (child) =>
      child.type === "paragraph" &&
      child.children.some((child) => child.type === "text" && child.value.includes("literal")),
  );
  assert.ok(literal && literal.type === "paragraph");
  assert.deepEqual(literal.children, [
    { type: "text", value: "A *literal* $price$ <tag>", position: literal.children[0].position },
  ]);
});

test("rough work exports only its content and does not change notes", () => {
  const saved = {
    ...note("pad", "Kept text", 1),
    origin: { kind: "rough-work" as const, scratchpadId: "p", title: "Old title" },
  };
  const before = JSON.stringify(saved);
  assert.equal(notesToMarkdown([saved], []), "Kept text\n");
  assert.equal(JSON.stringify(saved), before);
});

test("an empty notebook produces no content, and legacy highlights remain included", () => {
  assert.equal(notesToMarkdown([], []), "");
  const highlights: Highlight[] = [
    { id: "one", fileId: "gone", text: "Older", color: "yellow" },
    { id: "two", fileId: "gone", text: "Newer", color: "yellow" },
  ];
  const markdown = notesToMarkdown([], highlights);
  assert.equal(markdown, "Newer\n\nOlder\n");
});
