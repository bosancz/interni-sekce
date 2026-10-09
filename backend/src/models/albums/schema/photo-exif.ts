import exifReader = require("exif-reader");

export interface PhotoExif {
	make: string | null;
	model: string | null;
	lensModel: string | null;
	software: string | null;
	fNumber: number | null;
	exposureTime: number | null;
	iso: number | null;
	focalLength: number | null;
	focalLength35mm: number | null;
	exposureBias: number | null;
	flash: boolean | null;
	latitude: number | null;
	longitude: number | null;
	altitude: number | null;
}

export const EMPTY_PHOTO_EXIF: PhotoExif = {
	make: null,
	model: null,
	lensModel: null,
	software: null,
	fNumber: null,
	exposureTime: null,
	iso: null,
	focalLength: null,
	focalLength35mm: null,
	exposureBias: null,
	flash: null,
	latitude: null,
	longitude: null,
	altitude: null,
};

export function parsePhotoExif(exif: Buffer | undefined): PhotoExif {
	if (!exif) return { ...EMPTY_PHOTO_EXIF };

	const tags = exifReader(exif);
	const image = tags.Image ?? {};
	const photo = tags.Photo ?? {};
	const gps = tags.GPSInfo ?? {};

	const latitude = toCoordinate(gps.GPSLatitude, gps.GPSLatitudeRef, "S");
	const longitude = toCoordinate(gps.GPSLongitude, gps.GPSLongitudeRef, "W");
	const hasPosition = latitude !== null && longitude !== null && !(latitude === 0 && longitude === 0);
	const altitude = toNumber(gps.GPSAltitude);
	const flash = toNumber(photo.Flash);

	return {
		make: toText(image.Make),
		model: toText(image.Model),
		lensModel: toText(photo.LensModel),
		software: toText(image.Software),
		fNumber: toPositive(photo.FNumber),
		exposureTime: toPositive(photo.ExposureTime),
		iso: toPositive(Array.isArray(photo.ISOSpeedRatings) ? photo.ISOSpeedRatings[0] : photo.ISOSpeedRatings),
		focalLength: toPositive(photo.FocalLength),
		focalLength35mm: toPositive(photo.FocalLengthIn35mmFilm),
		exposureBias: toNumber(photo.ExposureBiasValue),
		flash: flash === null ? null : (flash & 1) === 1,
		latitude: hasPosition ? latitude : null,
		longitude: hasPosition ? longitude : null,
		altitude: hasPosition && altitude !== null ? (gps.GPSAltitudeRef === 1 ? -altitude : altitude) : null,
	};
}

function toText(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const text = value.replace(/\0/g, "").trim();
	return text || null;
}

function toNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPositive(value: unknown): number | null {
	const number = toNumber(value);
	return number !== null && number > 0 ? number : null;
}

function toCoordinate(value: unknown, ref: unknown, negativeRef: string): number | null {
	if (!Array.isArray(value) || value.length < 3) return null;

	const [degrees, minutes, seconds] = value.map(toNumber);
	if (degrees === null || minutes === null || seconds === null) return null;

	const coordinate = degrees + minutes / 60 + seconds / 3600;
	return toText(ref)?.toUpperCase() === negativeRef ? -coordinate : coordinate;
}
