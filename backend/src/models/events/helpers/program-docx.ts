import {
	AlignmentType,
	BorderStyle,
	Document,
	Footer,
	ImageRun,
	LineRuleType,
	IParagraphOptions,
	ITableCellBorders,
	Packer,
	PageNumber,
	Paragraph,
	ShadingType,
	Table,
	TableCell,
	TableLayoutType,
	TableRow,
	TabStopType,
	TextRun,
	VerticalAlign,
	WidthType,
} from "docx";
import { readFile } from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import type { ProgramContext, ProgramEventContext } from "../services/events-program-export.service";

const BODY_FONT = "Nunito Sans";
const HEADING_FONT = "San Grotesk";

const NAVY = "2a3478";
const YELLOW = "e28f26";
const TEXT = "1f2430";
const MUTED = "6b7185";
const FOOTER = "8a8fa3";
const LINE = "e4e7ef";
const TINT = "f4f5fa";
const RED = "d2232a";

const STATUS_COLORS: Record<string, { fill: string; color: string }> = {
	pending: { fill: "fdf1de", color: "b9720f" },
	rejected: { fill: "fdf1de", color: "b9720f" },
	cancelled: { fill: "fbe7e7", color: RED },
};
const DEFAULT_STATUS_COLORS = { fill: "eef1f6", color: MUTED };

const MM = 56.7;
const PX = 15;
const PAGE_WIDTH = Math.round(210 * MM);
const MARGIN = Math.round(14 * MM);
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const DATE_WIDTH = Math.round(30 * MM) + 14 * PX;
const BODY_WIDTH = CONTENT_WIDTH - DATE_WIDTH;
const LOGO_CELL_PX = 74;
const LOGO_WIDTH_PX = 62;

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_BORDERS: ITableCellBorders = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const TABLE_NO_BORDERS = { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

const NBSP = " ";

interface BarImage {
	data: Buffer;
	width: number;
	height: number;
}

export interface ProgramDocxAssets {
	fontsDir: string;
	logoFile: string;
}

export async function renderProgramDocx(context: ProgramContext, assets: ProgramDocxAssets): Promise<Buffer> {
	const [regular, bold, heading, logo, headerBar, monthBar] = await Promise.all([
		readFile(path.join(assets.fontsDir, "NunitoSans-Regular.ttf")),
		readFile(path.join(assets.fontsDir, "NunitoSans-Bold.ttf")),
		readFile(path.join(assets.fontsDir, "SanGrotesk-Regular.ttf")),
		renderLogo(assets.logoFile),
		bar([
			[64, YELLOW],
			[Math.floor(CONTENT_WIDTH / PX) - 64, NAVY],
		]),
		bar([[36, YELLOW]]),
	]);

	const content = context.months.length
		? context.months.flatMap((month) => monthBlock(month.label, month.events, monthBar))
		: [
				new Paragraph({
					alignment: AlignmentType.CENTER,
					spacing: { before: 40 * PX },
					children: [new TextRun({ text: "Filtru neodpovídají žádné akce.", size: px(13), color: MUTED })],
				}),
			];

	const document = new Document({
		creator: "Interní sekce ŠÁN",
		title: "Program akcí",
		fonts: [
			{ name: BODY_FONT, data: regular, bold },
			{ name: HEADING_FONT, data: heading },
		],
		styles: {
			default: {
				document: {
					run: { font: BODY_FONT, size: px(10.5), color: TEXT },
					paragraph: { spacing: { before: 0, after: 0, line: 252 } },
				},
			},
		},
		sections: [
			{
				properties: {
					page: {
						size: { width: PAGE_WIDTH, height: Math.round(297 * MM) },
						margin: {
							top: MARGIN,
							bottom: Math.round(16 * MM),
							left: MARGIN,
							right: MARGIN,
							footer: Math.round(7 * MM),
						},
					},
				},
				footers: { default: footer() },
				children: [header(context, logo), barParagraph(headerBar), ...content],
			},
		],
	});

	return Packer.toBuffer(document);
}

async function renderLogo(file: string) {
	const image = sharp(
		await sharp(await readFile(file), { density: 300 })
			.trim()
			.png()
			.toBuffer(),
	);
	const { width = 1, height = 1 } = await image.metadata();
	return {
		data: await image.png().toBuffer(),
		width: LOGO_WIDTH_PX,
		height: Math.round((LOGO_WIDTH_PX * height) / width),
	};
}

function header(context: ProgramContext, logo: { data: Buffer; width: number; height: number }) {
	const logoWidth = LOGO_CELL_PX * PX + 14 * PX;
	const metaWidth = Math.round(40 * MM);

	return new Table({
		width: { size: CONTENT_WIDTH, type: WidthType.DXA },
		columnWidths: [logoWidth, CONTENT_WIDTH - logoWidth - metaWidth, metaWidth],
		layout: TableLayoutType.FIXED,
		borders: TABLE_NO_BORDERS,
		rows: [
			new TableRow({
				children: [
					cell(logoWidth, [
						new Paragraph({
							spacing: { line: 240, lineRule: LineRuleType.AUTO },
							children: [
								new ImageRun({
									type: "png",
									data: logo.data,
									transformation: { width: logo.width, height: logo.height },
								}),
							],
						}),
					]),
					cell(CONTENT_WIDTH - logoWidth - metaWidth, [
						new Paragraph({
							spacing: { after: 4 * PX, line: 252 },
							children: [
								new TextRun({ text: "Program akcí", font: HEADING_FONT, size: px(30), color: NAVY }),
							],
						}),
						new Paragraph({
							children: [new TextRun({ text: context.subtitle, size: px(12), bold: true, color: MUTED })],
						}),
					]),
					cell(metaWidth, [
						new Paragraph({
							alignment: AlignmentType.RIGHT,
							children: [
								new TextRun({ text: context.countLabel, size: px(15), bold: true, color: NAVY }),
							],
						}),
						new Paragraph({
							alignment: AlignmentType.RIGHT,
							children: [
								new TextRun({
									text: `vygenerováno ${context.generatedAt}`,
									size: px(9.5),
									color: MUTED,
								}),
							],
						}),
					]),
				],
			}),
		],
	});
}

function monthBlock(label: string, events: ProgramEventContext[], monthBar: BarImage) {
	return [
		new Paragraph({
			keepNext: true,
			spacing: { before: 18 * PX, after: 3 * PX },
			children: [new TextRun({ text: label, font: HEADING_FONT, size: px(17), color: NAVY })],
		}),
		barParagraph(monthBar, { keepNext: true, spacing: { after: 2 * PX } }),
		new Table({
			width: { size: CONTENT_WIDTH, type: WidthType.DXA },
			columnWidths: [DATE_WIDTH, BODY_WIDTH],
			layout: TableLayoutType.FIXED,
			borders: TABLE_NO_BORDERS,
			rows: events.map((event, index) => eventRow(event, index === events.length - 1)),
		}),
	];
}

function eventRow(event: ProgramEventContext, last: boolean) {
	const rowBorder = last ? NO_BORDER : { style: BorderStyle.SINGLE, size: 6, color: LINE };
	const margins = { top: 8 * PX, bottom: 8 * PX };

	return new TableRow({
		cantSplit: true,
		children: [
			new TableCell({
				width: { size: DATE_WIDTH, type: WidthType.DXA },
				margins: { ...margins, left: 8 * PX, right: 14 * PX },
				borders: {
					...NO_BORDERS,
					bottom: rowBorder,
					left: { style: BorderStyle.SINGLE, size: 18, color: event.cancelled ? RED : NAVY },
				},
				children: [
					new Paragraph({
						children: [new TextRun({ text: event.dateLabel, size: px(12), bold: true, color: NAVY })],
					}),
					new Paragraph({
						children: [new TextRun({ text: event.weekdayLabel, size: px(9.5), color: MUTED })],
					}),
				],
			}),
			new TableCell({
				width: { size: BODY_WIDTH, type: WidthType.DXA },
				margins: { ...margins, left: 0, right: 0 },
				borders: { ...NO_BORDERS, bottom: rowBorder },
				children: [titleParagraph(event, BODY_WIDTH), ...detailsParagraph(event)],
			}),
		],
	});
}

function titleParagraph(event: ProgramEventContext, width: number) {
	const children = [
		new TextRun({
			text: event.name,
			size: px(12.5),
			bold: true,
			color: event.cancelled ? MUTED : TEXT,
			strike: event.cancelled,
		}),
	];

	if (event.status) {
		const colors = STATUS_COLORS[event.statusClass] ?? DEFAULT_STATUS_COLORS;
		children.push(
			new TextRun({ text: "\t" }),
			new TextRun({
				text: `${NBSP}${event.status}${NBSP}`,
				size: px(8.5),
				bold: true,
				color: colors.color,
				shading: { type: ShadingType.CLEAR, fill: colors.fill, color: "auto" },
			}),
		);
	}

	return new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: width - 2 * PX }], children });
}

function detailsParagraph(event: ProgramEventContext) {
	const parts: TextRun[][] = [];

	if (event.groups.length) {
		parts.push(
			event.groups.flatMap((group, index) => [
				...(index ? [new TextRun({ text: " ", size: px(9) })] : []),
				new TextRun({
					text: `${NBSP}■`,
					font: "Arial",
					size: px(9),
					color: group.color.replace("#", ""),
					shading: tint(),
				}),
				new TextRun({
					text: `${NBSP}${group.shortName}${NBSP}`,
					size: px(9),
					bold: true,
					color: TEXT,
					shading: tint(),
				}),
			]),
		);
	}
	if (event.place) parts.push(labelled("Místo:", event.place));
	if (event.leaders.length) parts.push(labelled("Vede:", event.leaders.join(", ")));

	if (!parts.length) return [];

	const options: IParagraphOptions = {
		spacing: { before: 3 * PX },
		children: parts.flatMap((part, index) => [
			...(index ? [new TextRun({ text: `${NBSP}${NBSP}${NBSP} ` })] : []),
			...part,
		]),
	};
	return [new Paragraph(options)];
}

function labelled(label: string, value: string) {
	return [new TextRun({ text: `${label} `, bold: true, color: TEXT }), new TextRun({ text: value, color: MUTED })];
}

function tint() {
	return { type: ShadingType.CLEAR, fill: TINT, color: "auto" };
}

async function bar(segments: [number, string][]) {
	const scale = 4;
	const height = 3 * scale;
	const width = segments.reduce((sum, [segmentWidth]) => sum + segmentWidth, 0) * scale;
	const pixels = Buffer.alloc(width * height * 3);

	let offset = 0;
	for (const [segmentWidth, color] of segments) {
		const rgb = [0, 2, 4].map((index) => parseInt(color.slice(index, index + 2), 16));
		for (let x = offset; x < offset + segmentWidth * scale; x++) {
			for (let y = 0; y < height; y++) pixels.set(rgb, (y * width + x) * 3);
		}
		offset += segmentWidth * scale;
	}

	return {
		data: await sharp(pixels, { raw: { width, height, channels: 3 } })
			.png()
			.toBuffer(),
		width: width / scale,
		height: 3,
	};
}

function barParagraph(image: BarImage, options: IParagraphOptions = {}) {
	return new Paragraph({
		...options,
		spacing: { line: 3 * PX, lineRule: LineRuleType.EXACT, ...options.spacing },
		children: [new ImageRun({ type: "png", data: image.data, transformation: image })],
	});
}

function cell(width: number, children: Paragraph[]) {
	return new TableCell({
		width: { size: width, type: WidthType.DXA },
		verticalAlign: VerticalAlign.CENTER,
		margins: { top: 0, bottom: 12 * PX, left: 0, right: 0 },
		children,
	});
}

function footer() {
	const style = { size: px(8), color: FOOTER };

	return new Footer({
		children: [
			new Paragraph({
				tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
				children: [
					new TextRun({ ...style, text: "Interní sekce ŠÁN · Program akcí\t" }),
					new TextRun({ ...style, children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES] }),
				],
			}),
		],
	});
}

function px(value: number) {
	return Math.round(value * 1.5);
}
