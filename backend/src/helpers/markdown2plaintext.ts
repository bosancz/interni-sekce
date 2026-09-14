import { marked, type Token, type Tokens } from "marked";

const HR = "————————";

export function markdownToPlainText(markdown: string | null | undefined): string {
	if (!markdown || !markdown.trim()) return "";

	return renderBlocks(marked.lexer(markdown))
		.join("\n\n")
		.replace(/[ \t]+$/gm, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function renderBlocks(tokens: Token[]): string[] {
	return tokens.map(renderBlock).filter((block) => block.length > 0);
}

function renderBlock(token: Token): string {
	switch (token.type) {
		case "heading":
			return renderInline((token as Tokens.Heading).tokens);

		case "paragraph":
			return renderInline((token as Tokens.Paragraph).tokens);

		case "text": {
			const text = token as Tokens.Text;
			return text.tokens?.length ? renderInline(text.tokens) : text.text;
		}

		case "list":
			return renderList(token as Tokens.List);

		case "blockquote":
			return renderBlocks((token as Tokens.Blockquote).tokens).join("\n\n");

		case "code":
			return (token as Tokens.Code).text;

		case "table":
			return renderTable(token as Tokens.Table);

		case "hr":
			return HR;

		case "space":
			return "";

		case "html":
			return stripTags((token as Tokens.HTML).raw);

		default: {
			const other = token as { tokens?: Token[]; text?: string; raw?: string };
			if (other.tokens?.length) return renderInline(other.tokens);
			return other.text ?? other.raw ?? "";
		}
	}
}

function renderList(list: Tokens.List): string {
	const start = typeof list.start === "number" ? list.start : 1;

	return list.items
		.map((item, i) => {
			const prefix = list.ordered ? `${start + i}. ` : "• ";
			const content = renderBlocks(item.tokens).join("\n");
			return indent(content, prefix);
		})
		.join("\n");
}

function renderTable(table: Tokens.Table): string {
	const rows = [table.header, ...table.rows];
	return rows.map((row) => row.map((cell) => renderInline(cell.tokens)).join(" | ")).join("\n");
}

function renderInline(tokens: Token[] | undefined): string {
	if (!tokens) return "";

	return tokens
		.map((token) => {
			switch (token.type) {
				case "strong":
					return renderInline((token as Tokens.Strong).tokens);

				case "em":
					return renderInline((token as Tokens.Em).tokens);

				case "del":
					return renderInline((token as Tokens.Del).tokens);

				case "codespan":
					return (token as Tokens.Codespan).text;

				case "link":
					return renderLink(token as Tokens.Link);

				case "image": {
					const image = token as Tokens.Image;
					return image.text || image.title || image.href;
				}

				case "br":
					return "\n";

				case "escape":
					return (token as Tokens.Escape).text;

				case "html":
					return stripTags((token as Tokens.HTML).raw);

				case "text": {
					const text = token as Tokens.Text;
					return text.tokens?.length ? renderInline(text.tokens) : text.text;
				}

				default: {
					const other = token as { tokens?: Token[]; text?: string; raw?: string };
					if (other.tokens?.length) return renderInline(other.tokens);
					return other.text ?? other.raw ?? "";
				}
			}
		})
		.join("");
}

function renderLink(link: Tokens.Link): string {
	const text = renderInline(link.tokens) || link.text;
	if (!text || text === link.href) return link.href;
	return `${text} (${link.href})`;
}

function indent(content: string, prefix: string): string {
	const [first, ...rest] = content.split("\n");
	const padding = " ".repeat(prefix.length);
	return [prefix + first, ...rest.map((line) => padding + line)].join("\n");
}

function stripTags(html: string): string {
	return html.replace(/<[^>]*>/g, "").trim();
}
