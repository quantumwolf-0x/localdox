import type { Highlight } from "../markdown/dom-highlighter.ts";
import { notebookEntries, type Note } from "./notes.ts";

/** Keep highlight text literal when written into Markdown. */
function literal(text: string): string {
  return text.replace(/[\\`*_{}[\]()<>#+.!|~$-]/g, "\\$&");
}

/** The whole Notes tab as continuous content, in the same order as its cards. */
export function notesToMarkdown(notes: readonly Note[], highlights: readonly Highlight[]): string {
  const sections = notebookEntries(notes, highlights).map((entry) => {
    if (entry.kind === "note") {
      // Preserve Markdown, including indentation for code blocks.
      return entry.note.content.replace(/^\n+/, "").trimEnd();
    }
    return literal(entry.highlight.text.trim());
  });
  const content = sections.filter((section) => section.trim()).join("\n\n");
  return content ? content + "\n" : "";
}
