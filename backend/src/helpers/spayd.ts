export interface SpaydPayment {
	iban: string;
	amount: number;
	currency: string;
	variableSymbol: string;
	message: string;
}

const SPAYD_VERSION = "1.0";

export function getSpayd(payment: SpaydPayment): string {
	const fields: [string, string][] = [
		["ACC", payment.iban],
		["AM", payment.amount.toFixed(2)],
		["CC", payment.currency],
		["X-VS", payment.variableSymbol],
		["MSG", payment.message],
	];

	const values = fields.filter(([, value]) => !!value).map(([key, value]) => `${key}:${escapeSpaydValue(value)}`);

	return ["SPD", SPAYD_VERSION, ...values].join("*");
}

function escapeSpaydValue(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^\x20-\x7e]/g, "")
		.replace(/[*%]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
		.trim();
}
