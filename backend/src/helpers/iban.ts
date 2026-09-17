const COUNTRY_CODE = "CZ";
const ACCOUNT_PREFIX_LENGTH = 6;
const ACCOUNT_NUMBER_LENGTH = 10;
const BANK_CODE_LENGTH = 4;

export function getCzechIban(accountNumber: string, bankCode: string): string {
	const [prefix, number] = accountNumber.includes("-") ? accountNumber.split("-") : ["", accountNumber];

	const bban =
		bankCode.padStart(BANK_CODE_LENGTH, "0") +
		prefix.padStart(ACCOUNT_PREFIX_LENGTH, "0") +
		number.padStart(ACCOUNT_NUMBER_LENGTH, "0");

	return COUNTRY_CODE + getCheckDigits(bban) + bban;
}

function getCheckDigits(bban: string): string {
	const letters = [...COUNTRY_CODE].map((letter) => letter.charCodeAt(0) - "A".charCodeAt(0) + 10).join("");

	return String(98 - mod97(bban + letters + "00")).padStart(2, "0");
}

function mod97(digits: string): number {
	let remainder = 0;
	for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;

	return remainder;
}
