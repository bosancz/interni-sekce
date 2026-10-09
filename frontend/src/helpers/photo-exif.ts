import { SDK } from "src/sdk";

const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
const coordinateFormat = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 5, maximumFractionDigits: 5 });

export function getExifCamera(exif: SDK.PhotoExifResponse): string | null {
	const make = exif.make?.trim();
	const model = exif.model?.trim();
	if (!model) return make || null;
	if (!make || model.toLowerCase().startsWith(make.toLowerCase().split(" ")[0])) return model;
	return `${make} ${model}`;
}

export function formatExifAperture(fNumber: number): string {
	return `f/${numberFormat.format(fNumber)}`;
}

export function formatExifExposureTime(seconds: number): string {
	if (seconds >= 1) return `${numberFormat.format(seconds)} s`;
	return `1/${Math.round(1 / seconds)} s`;
}

export function formatExifFocalLength(exif: SDK.PhotoExifResponse): string | null {
	if (!exif.focalLength) return null;
	const focalLength = `${numberFormat.format(exif.focalLength)} mm`;
	if (!exif.focalLength35mm || Math.round(exif.focalLength35mm) === Math.round(exif.focalLength)) return focalLength;
	return `${focalLength} (ekv. ${numberFormat.format(exif.focalLength35mm)} mm)`;
}

export function formatExifExposureBias(bias: number): string {
	if (Math.abs(bias) < 0.01) return "0 EV";
	const sign = bias > 0 ? "+" : "−";
	const thirds = Math.round(Math.abs(bias) * 3);
	if (Math.abs(Math.abs(bias) * 3 - thirds) > 0.05) return `${sign}${numberFormat.format(Math.abs(bias))} EV`;

	const whole = Math.floor(thirds / 3);
	const fraction = thirds % 3 ? `${thirds % 3}/3` : "";
	return `${sign}${[whole || "", fraction].filter(Boolean).join(" ")} EV`;
}

export function formatExifCoordinates(latitude: number, longitude: number): string {
	const lat = `${coordinateFormat.format(Math.abs(latitude))}° ${latitude >= 0 ? "N" : "S"}`;
	const lon = `${coordinateFormat.format(Math.abs(longitude))}° ${longitude >= 0 ? "E" : "W"}`;
	return `${lat}, ${lon}`;
}

export function getExifMapUrl(latitude: number, longitude: number): string {
	return `https://mapy.com/fnc/v1/showmap?mapset=outdoor&center=${longitude},${latitude}&zoom=16&marker=true`;
}
