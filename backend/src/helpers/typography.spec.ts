import { Marked } from "marked";
import { markdownToPlainText } from "./markdown2plaintext";
import { fixTypography, typographyExtension } from "./typography";

const NBSP = " ";
const markdown = new Marked({ async: false, breaks: true }, typographyExtension);

describe("fixTypography", () => {
	it("keeps an ordinal number with its word", () => {
		expect(fixTypography("Černý Most (autobusové nádraží, 3. nástupiště), 17:00")).toBe(
			`Černý Most (autobusové nádraží, 3.${NBSP}nástupiště), 17:00`,
		);
	});

	it("binds one-letter prepositions and uses Czech quotes, dashes and ellipsis", () => {
		expect(fixTypography('Sraz u "Kotvy" a pak k řece - nezapomeňte...')).toBe(
			`Sraz u${NBSP}„Kotvy“ a${NBSP}pak k${NBSP}řece${NBSP}– nezapomeňte…`,
		);
	});
});

describe("typographyExtension", () => {
	it("fixes text across inline formatting", () => {
		expect(markdown.parse('Sraz v **lese** u "*Kotvy*"')).toBe(
			`<p>Sraz v${NBSP}<strong>lese</strong> u${NBSP}„<em>Kotvy</em>“</p>\n`,
		);
	});

	it("leaves code, links and list syntax alone", () => {
		expect(markdown.parse('1. [web](https://bosan.cz/a-b...c) a `"x" -- ...`\n2. info@bosan.cz')).toBe(
			`<ol>\n<li><a href="https://bosan.cz/a-b...c">web</a> a${NBSP}<code>&quot;x&quot; -- ...</code></li>\n<li><a href="mailto:info@bosan.cz">info@bosan.cz</a></li>\n</ol>\n`,
		);
	});

	it("applies to inline markdown", () => {
		expect(markdown.parseInline("Dno pytle, 3. nástupiště")).toBe(`Dno pytle, 3.${NBSP}nástupiště`);
	});
});

describe("markdownToPlainText", () => {
	it("applies typography", () => {
		expect(markdownToPlainText('**Sraz** u "Kotvy"')).toBe(`Sraz u${NBSP}„Kotvy“`);
	});
});
