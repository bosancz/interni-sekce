export const PhotoCaptionFields = {
	xmpDescription: { label: "Popis", tech: "XMP dc:description" },
	iptcCaption: { label: "Popis (IPTC)", tech: "IPTC Caption-Abstract" },
	exifDescription: { label: "Popis (EXIF)", tech: "EXIF ImageDescription" },
	xmpTitle: { label: "Název", tech: "XMP dc:title" },
	iptcObjectName: { label: "Název (IPTC)", tech: "IPTC Object Name" },
	headline: { label: "Titulek", tech: "XMP/IPTC Headline" },
	windowsTitle: { label: "Název (Windows)", tech: "Windows XPTitle" },
	windowsSubject: { label: "Předmět (Windows)", tech: "Windows XPSubject" },
	windowsComment: { label: "Komentář (Windows)", tech: "Windows XPComment" },
	userComment: { label: "Komentář (EXIF)", tech: "EXIF UserComment" },
	author: { label: "Autor", tech: "dc:creator, IPTC By-line, EXIF Artist" },
} as const;

export type PhotoCaptionField = keyof typeof PhotoCaptionFields;

export type PhotoCaptionValues = Partial<Record<PhotoCaptionField, string>>;

const PREFERRED_LANGUAGES = ["x-default", "cs", "cs-cz"];

const JUNK_CAPTIONS = [
	/digital (still )?camera/i,
	/^(sony )?dsc$/i,
	/^exif[ _]jpeg([ _]picture)?$/i,
	/^(samsung )?camera pictures?$/i,
	/^(default|image|picture|photo|untitled|description|no description|camera)$/i,
	/^(img|dsc|dscn|dscf|pxl|imag|mvimg)[_ -]?\d+/i,
	/^p\d{7}$/i,
	/^dcim\b/i,
	/^screenshot\b/i,
	/\.(jpe?g|heic|heif|png|tiff?|webp|dng|raw|cr2|nef|arw)$/i,
];

export async function readPhotoCaptionValues(file: Blob): Promise<PhotoCaptionValues> {
	const { default: exifr } = await import("exifr");

	const output = await exifr.parse(file, {
		exif: true,
		gps: false,
		iptc: true,
		xmp: true,
		mergeOutput: false,
		multiSegment: true,
		translateValues: false,
	});

	return getPhotoCaptionValues(output ?? {});
}

export function getPhotoCaptionValues(output: Record<string, any>): PhotoCaptionValues {
	const ifd0 = output["ifd0"] ?? {};
	const exif = output["exif"] ?? {};
	const iptc = output["iptc"] ?? {};
	const dc = output["dc"] ?? {};
	const photoshop = output["photoshop"] ?? {};

	const cameraNames = [toText(ifd0.Make), toText(ifd0.Model)];

	const values: Record<PhotoCaptionField, string | null> = {
		xmpDescription: langAltText(dc.description),
		iptcCaption: iptcText(iptc.Caption),
		exifDescription: toText(ifd0.ImageDescription),
		xmpTitle: langAltText(dc.title),
		iptcObjectName: iptcText(iptc.ObjectName),
		headline: toText(photoshop.Headline) ?? iptcText(iptc.Headline),
		windowsTitle: windowsText(ifd0.XPTitle),
		windowsSubject: windowsText(ifd0.XPSubject),
		windowsComment: windowsText(ifd0.XPComment),
		userComment: userCommentText(exif.UserComment),
		author: copyrightText(listText(dc.creator) ?? iptcText(iptc.Byline) ?? toText(ifd0.Artist)),
	};

	const result: PhotoCaptionValues = {};
	for (const [field, value] of Object.entries(values) as [PhotoCaptionField, string | null][]) {
		if (value && !isJunkCaption(value, cameraNames)) result[field] = value;
	}
	return result;
}

export function isJunkCaption(caption: string, cameraNames: (string | null)[] = []): boolean {
	if (!/\p{L}/u.test(caption)) return true;

	const normalized = normalizeName(caption);
	if (cameraNames.some((name) => name && normalizeName(name) === normalized)) return true;

	return JUNK_CAPTIONS.some((pattern) => pattern.test(caption));
}

function copyrightText(author: string | null): string | null {
	if (!author || /^(©|\(c\)|copyright\b)/i.test(author)) return author;
	return `© ${author}`;
}

function normalizeName(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toText(value: unknown): string | null {
	if (typeof value === "number") value = String(value);
	if (typeof value !== "string") return null;

	const text = value.replace(/\0/g, "").normalize("NFC").trim();
	return text || null;
}

function langAltText(value: unknown): string | null {
	if (Array.isArray(value)) {
		const items = value
			.map((item) => ({
				lang: typeof item?.lang === "string" ? item.lang.toLowerCase() : null,
				text: langAltText(item),
			}))
			.filter((item) => item.text);
		const preferred = PREFERRED_LANGUAGES.map((lang) => items.find((item) => item.lang === lang)).find(Boolean);
		return (preferred ?? items[0])?.text ?? null;
	}

	if (value && typeof value === "object" && "value" in value) return toText(value.value);

	return toText(value);
}

function listText(value: unknown): string | null {
	if (Array.isArray(value)) {
		const items = value.map(langAltText).filter((item): item is string => !!item);
		return items.length ? items.join(", ") : null;
	}

	return langAltText(value);
}

function iptcText(value: unknown): string | null {
	const text = toText(Array.isArray(value) ? value.join(", ") : value);
	if (!text || !/[\u0080-ÿ]/.test(text) || /[^\u0000-ÿ]/.test(text)) return text;

	const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));
	try {
		return toText(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch {
		return toText(new TextDecoder("windows-1250").decode(bytes));
	}
}

function windowsText(value: unknown): string | null {
	const bytes = toBytes(value);
	return bytes ? toText(new TextDecoder("utf-16le").decode(bytes)) : toText(value);
}

function userCommentText(value: unknown): string | null {
	const bytes = toBytes(value);
	if (!bytes) return toText(value);

	const header = new TextDecoder("ascii").decode(bytes.slice(0, 8)).replace(/\0/g, "").trim().toUpperCase();
	const body = bytes.slice(8);

	if (header === "UNICODE") return toText(new TextDecoder("utf-16le").decode(body));
	if (header === "ASCII" || header === "") return toText(new TextDecoder("utf-8").decode(body));
	return null;
}

function toBytes(value: unknown): Uint8Array | null {
	if (value instanceof Uint8Array) return value;
	if (Array.isArray(value) && value.every((item) => typeof item === "number")) return Uint8Array.from(value);
	return null;
}
