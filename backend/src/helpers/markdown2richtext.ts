import { marked, type Token, type Tokens } from "marked";
import * as xlsxPopulate from "xlsx-populate";

// @types/xlsx-populate omits the RichText API, so we type the bits we use locally.
// The runtime class is exported as `xlsxPopulate.RichText`.
interface RichTextFragment {
	value(): string;
	style(names: string[]): { [key: string]: unknown };
}
export interface RichText {
	readonly length: number;
	text(): string;
	get(index: number): RichTextFragment;
	add(text: string, styles?: FragmentStyle, index?: number | null): RichText;
}
const RichTextCtor = (xlsxPopulate as unknown as { RichText: new () => RichText }).RichText;

/**
 * Styles understood by xlsx-populate's RichTextFragment that we map Markdown onto.
 * Unset properties are inherited from the cell's default font.
 */
interface FragmentStyle {
	bold?: boolean;
	italic?: boolean;
	strikethrough?: boolean;
	underline?: boolean;
	fontSize?: number;
	fontFamily?: string;
	fontColor?: string;
}

const MONOSPACE = "Courier New";
const LINK_COLOR = "0563C1";
const HEADING_SIZES: Record<number, number> = { 1: 16, 2: 14, 3: 13, 4: 12, 5: 11, 6: 11 };

/**
 * Converts a Markdown string into an xlsx-populate {@link RichText} instance so that bold, italic,
 * headings, lists, etc. render as real Excel formatting inside a single cell instead of raw Markdown.
 *
 * Tables and images are not representable as single-cell rich text and are flattened to their text.
 */
export function markdownToRichText(markdown: string | null | undefined): RichText {
	const richText = new RichTextCtor();
	if (!markdown || !markdown.trim()) return richText;

	const tokens = marked.lexer(markdown);

	const add = (text: string, style: FragmentStyle = {}) => {
		if (text === "") return;
		// xlsx-populate's `add` rejects empty style objects on some paths; only pass when non-empty.
		richText.add(text, Object.keys(style).length ? style : undefined);
	};

	const newline = () => richText.add("\n");

	/** Walks inline tokens, composing inherited styles so nested marks (e.g. bold inside italic) stack. */
	const walkInline = (inlineTokens: Token[] | undefined, inherited: FragmentStyle) => {
		if (!inlineTokens) return;
		for (const token of inlineTokens) {
			switch (token.type) {
				case "strong":
					walkInline((token as Tokens.Strong).tokens, { ...inherited, bold: true });
					break;
				case "em":
					walkInline((token as Tokens.Em).tokens, { ...inherited, italic: true });
					break;
				case "del":
					walkInline((token as Tokens.Del).tokens, { ...inherited, strikethrough: true });
					break;
				case "codespan":
					add((token as Tokens.Codespan).text, { ...inherited, fontFamily: MONOSPACE });
					break;
				case "link":
					add((token as Tokens.Link).text, { ...inherited, underline: true, fontColor: LINK_COLOR });
					break;
				case "br":
					newline();
					break;
				case "escape":
					add((token as Tokens.Escape).text, inherited);
					break;
				case "text": {
					const t = token as Tokens.Text;
					if (t.tokens?.length) walkInline(t.tokens, inherited);
					else add(t.text, inherited);
					break;
				}
				default: {
					// Unknown/unsupported inline token: fall back to its raw text content.
					const t = token as { tokens?: Token[]; text?: string; raw?: string };
					if (t.tokens?.length) walkInline(t.tokens, inherited);
					else add(t.text ?? t.raw ?? "", inherited);
				}
			}
		}
	};

	const walkBlocks = (blockTokens: Token[]) => {
		blockTokens.forEach((token, index) => {
			switch (token.type) {
				case "heading": {
					const h = token as Tokens.Heading;
					walkInline(h.tokens, { bold: true, fontSize: HEADING_SIZES[h.depth] ?? 11 });
					newline();
					break;
				}
				case "paragraph": {
					walkInline((token as Tokens.Paragraph).tokens, {});
					newline();
					break;
				}
				case "text": {
					const t = token as Tokens.Text;
					if (t.tokens?.length) walkInline(t.tokens, {});
					else add(t.text);
					newline();
					break;
				}
				case "list": {
					const list = token as Tokens.List;
					const start = typeof list.start === "number" ? list.start : 1;
					list.items.forEach((item, i) => {
						const prefix = list.ordered ? `${start + i}. ` : "• ";
						add(prefix);
						walkInline(item.tokens, {});
						newline();
					});
					break;
				}
				case "blockquote": {
					walkInline((token as Tokens.Blockquote).tokens, { italic: true });
					newline();
					break;
				}
				case "code": {
					const code = token as Tokens.Code;
					code.text.split("\n").forEach((line) => {
						add(line, { fontFamily: MONOSPACE });
						newline();
					});
					break;
				}
				case "hr":
					add("────────");
					newline();
					break;
				case "space":
					// Blank line between blocks; avoid a trailing newline at the very end.
					if (index < blockTokens.length - 1) newline();
					break;
				default: {
					// Tables, html, defs, etc.: keep the textual content rather than dropping it.
					const t = token as { text?: string; raw?: string };
					if (t.text || t.raw) {
						add(t.text ?? t.raw ?? "");
						newline();
					}
				}
			}
		});
	};

	walkBlocks(tokens);
	return richText;
}
