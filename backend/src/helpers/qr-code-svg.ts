import { BitMatrix, create as createQrCode } from "qrcode";

export interface QrCodeSvgOptions {
	size: number;
	color: string;
	background: string;
	logo?: string;
}

const QUIET_ZONE = 4;
const FINDER_SIZE = 7;
const FINDER_RADIUS = 2;
const FINDER_CENTER_RADIUS = 1;
const LOGO_AREA_RATIO = 0.26;
const LOGO_AREA_RADIUS_RATIO = 0.18;
const LOGO_PADDING_RATIO = 0.1;

export function renderQrCodeSvg(data: string, options: QrCodeSvgOptions): string {
	const { modules } = createQrCode(data, { errorCorrectionLevel: "H" });
	const count = modules.size;
	const total = count + 2 * QUIET_ZONE;

	const logoArea = options.logo ? getLogoArea(total) : null;
	const finders = [
		[0, 0],
		[count - FINDER_SIZE, 0],
		[0, count - FINDER_SIZE],
	];

	const parts: string[] = [
		`<rect width="${total}" height="${total}" fill="${options.background}"/>`,
		`<path shape-rendering="crispEdges" fill="${options.color}" d="${getModulesPath(modules, finders, logoArea)}"/>`,
		...finders.map(([column, row]) => getFinder(column + QUIET_ZONE, row + QUIET_ZONE, options.color)),
	];

	if (options.logo && logoArea) parts.push(...getLogo(options.logo, logoArea, options.background));

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}"`,
		` viewBox="0 0 ${total} ${total}" role="img">`,
		parts.join(""),
		`</svg>`,
	].join("");
}

interface LogoArea {
	from: number;
	side: number;
}

function getLogoArea(total: number): LogoArea {
	const side = total * LOGO_AREA_RATIO;

	return { from: (total - side) / 2, side };
}

function getModulesPath(modules: BitMatrix, finders: number[][], logoArea: LogoArea | null): string {
	const path: string[] = [];

	for (let row = 0; row < modules.size; row++) {
		for (let column = 0; column < modules.size; column++) {
			if (!modules.get(row, column)) continue;
			if (finders.some(([x, y]) => isWithin(column, x) && isWithin(row, y))) continue;

			const x = column + QUIET_ZONE;
			const y = row + QUIET_ZONE;
			if (logoArea && overlapsLogo(x, y, logoArea)) continue;

			path.push(`M${x} ${y}h1v1h-1z`);
		}
	}

	return path.join("");
}

function isWithin(position: number, origin: number): boolean {
	return position >= origin && position < origin + FINDER_SIZE;
}

function overlapsLogo(x: number, y: number, logoArea: LogoArea): boolean {
	const to = logoArea.from + logoArea.side;

	return x + 1 > logoArea.from && x < to && y + 1 > logoArea.from && y < to;
}

function getFinder(x: number, y: number, color: string): string {
	const ring = [
		`<rect x="${x + 0.5}" y="${y + 0.5}" width="${FINDER_SIZE - 1}" height="${FINDER_SIZE - 1}"`,
		` rx="${FINDER_RADIUS}" fill="none" stroke="${color}" stroke-width="1"/>`,
	].join("");

	const center = [
		`<rect x="${x + 2}" y="${y + 2}" width="3" height="3"`,
		` rx="${FINDER_CENTER_RADIUS}" fill="${color}"/>`,
	].join("");

	return ring + center;
}

function getLogo(logo: string, logoArea: LogoArea, background: string): string[] {
	const padding = logoArea.side * LOGO_PADDING_RATIO;
	const side = round(logoArea.side - 2 * padding);
	const position = round(logoArea.from + padding);

	const backdrop = [
		`<rect x="${round(logoArea.from)}" y="${round(logoArea.from)}"`,
		` width="${round(logoArea.side)}" height="${round(logoArea.side)}"`,
		` rx="${round(logoArea.side * LOGO_AREA_RADIUS_RATIO)}" fill="${background}"/>`,
	].join("");

	const embedded = logo
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/^[\s\S]*?<svg\b/, `<svg x="${position}" y="${position}" width="${side}" height="${side}"`);

	return [backdrop, embedded];
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000;
}
