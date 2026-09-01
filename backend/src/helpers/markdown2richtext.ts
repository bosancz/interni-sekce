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
// Excel počítá výšku řádku v bodech; poměr k velikosti písma odpovídá běžnému řádkování.
const LINE_HEIGHT_RATIO = 1.35;

/**
 * Converts a Markdown string into an xlsx-populate {@link RichText} instance so that bold, italic,
 * headings, lists, etc. render as real Excel formatting inside a single cell instead of raw Markdown.
 *
 * Tables and images are not representable as single-cell rich text and are flattened to their text.
 *
 * @param options.fontFamily písmo pro celý text. Fragmenty rich textu bez vlastního písma nedědí
 *   font buňky spolehlivě — Excel ano, LibreOffice sáhne po svém výchozím patkovém —, takže když
 *   má text zapadnout do zbytku sešitu, je potřeba písmo předat.
 */
export function markdownToRichText(
	markdown: string | null | undefined,
	options: { fontFamily?: string } = {},
): RichText {
	const richText = new RichTextCtor();
	if (!markdown || !markdown.trim()) return richText;

	const base: FragmentStyle = options.fontFamily ? { fontFamily: options.fontFamily } : {};
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
					walkInline(h.tokens, { ...base, bold: true, fontSize: HEADING_SIZES[h.depth] ?? 11 });
					newline();
					break;
				}
				case "paragraph": {
					walkInline((token as Tokens.Paragraph).tokens, base);
					newline();
					break;
				}
				case "text": {
					const t = token as Tokens.Text;
					if (t.tokens?.length) walkInline(t.tokens, base);
					else add(t.text, base);
					newline();
					break;
				}
				case "list": {
					const list = token as Tokens.List;
					const start = typeof list.start === "number" ? list.start : 1;
					list.items.forEach((item, i) => {
						const prefix = list.ordered ? `${start + i}. ` : "• ";
						add(prefix, base);
						walkInline(item.tokens, base);
						newline();
					});
					break;
				}
				case "blockquote": {
					walkInline((token as Tokens.Blockquote).tokens, { ...base, italic: true });
					newline();
					break;
				}
				case "code": {
					const code = token as Tokens.Code;
					code.text.split("\n").forEach((line) => {
						add(line, { ...base, fontFamily: MONOSPACE });
						newline();
					});
					break;
				}
				case "hr":
					add("────────", base);
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
						add(t.text ?? t.raw ?? "", base);
						newline();
					}
				}
			}
		});
	};

	walkBlocks(tokens);
	return richText;
}

/**
 * Excel neumí u sloučené buňky dopočítat výšku podle obsahu (autofit funguje jen na běžných
 * buňkách), takže si ji musíme odhadnout sami — jinak se delší report v šabloně účtování oříznul.
 *
 * @param richText text, který do buňky půjde
 * @param charsPerLine kolik znaků základní velikosti písma se vejde na řádek sloučené buňky
 * @param baseFontSize velikost písma buňky; nadpisy jsou větší a vejde se jich na řádek méně
 * @returns potřebná výška v bodech
 */
export function estimateRichTextHeight(richText: RichText, charsPerLine: number, baseFontSize = 10): number {
	const lines: { chars: number; fontSize: number }[] = [{ chars: 0, fontSize: baseFontSize }];

	for (let index = 0; index < richText.length; index++) {
		const fragment = richText.get(index);
		const fontSize = Number(fragment.style(["fontSize"]).fontSize) || baseFontSize;

		// jeden fragment může obsahovat i konce řádků, které rich text vkládá mezi bloky
		// (xlsx-populate je při zápisu normalizuje na CRLF, tak počítáme s oběma podobami)
		fragment
			.value()
			.split(/\r\n|[\r\n]/)
			.forEach((part, partIndex) => {
				if (partIndex > 0) lines.push({ chars: 0, fontSize: baseFontSize });

				const line = lines[lines.length - 1];
				line.chars += part.length;
				line.fontSize = Math.max(line.fontSize, fontSize);
			});
	}

	return lines.reduce((height, line) => {
		// větší písmo = méně znaků na řádek, takže se text zalomí dřív
		const lineCapacity = Math.max(1, (charsPerLine * baseFontSize) / line.fontSize);
		const wrappedLines = Math.max(1, Math.ceil(line.chars / lineCapacity));

		return height + wrappedLines * line.fontSize * LINE_HEIGHT_RATIO;
	}, 0);
}
