import { currentMembershipYear } from "src/app/core/helpers/membership";
import { getVariableSymbolYear } from "src/app/core/helpers/variable-symbol";
import { SDK } from "src/sdk";

/**
 * `CZK` is spelled out as the local "Kč" – a currency label; the amount itself and the
 * currency code both come from the API.
 */
export function formatPaymentAmount(payment: Pick<SDK.MemberPaymentRequestResponseWithLinks, "amount" | "currency">) {
	return `${payment.amount} ${payment.currency === "CZK" ? "Kč" : payment.currency}`;
}

/**
 * The year the payment is for. It is read back out of the variable symbol rather than taken
 * from today's date: the symbol is what the recipient will type into their bank, so the year
 * named in the e-mail is by definition the year that symbol was issued for.
 */
export function getPaymentYear(payment: Pick<SDK.MemberPaymentRequestResponseWithLinks, "variableSymbol">): number {
	return getVariableSymbolYear(payment.variableSymbol) ?? currentMembershipYear();
}

export function getPaymentMailto(
	payment: SDK.MemberPaymentRequestResponseWithLinks,
	recipients: string[],
	member?: SDK.MemberResponse | null,
) {
	const name = member?.nickname ? ` – ${member.nickname}` : "";
	const amount = formatPaymentAmount(payment);
	const year = getPaymentYear(payment);

	const subject = `Členský příspěvek ${year}${name}`;

	const body = [
		"Dobrý den,",
		"",
		`prosím vás o zaplacení členského příspěvku na kalendářní rok ${year} ve výši ${amount}.`,
		"",
		`Číslo účtu: ${payment.accountNumber}/${payment.bankCode}`,
		`Variabilní symbol: ${payment.variableSymbol}`,
		`Částka: ${amount}`,
		"",
		"Platbu můžete provést i naskenováním QR kódu, který se otevře na tomto odkazu:",
		payment.qrCodeUrl,
		"",
		"Děkujeme.",
		"",
		// the club's official footer, as it appears on the rest of its correspondence
		"KONDOR Skupina ŠÁN z.s.",
		"Podolské nábřeží 1180/5, Praha 4, 147 00",
		"E-mail: info@bosan.cz",
		"IČ: 47610727",
	].join("\r\n");

	// `mailto:` cannot carry an attachment, hence the QR as a link in the body above.
	// Addresses keep their `@` (allowed unencoded in a mailto address per RFC 6068) so the
	// comma-separated recipient list stays readable to every mail client.
	//
	// Nothing put in the subject or the body may contain `&` or `=`, percent-encoded or not:
	// Android's mailto parser decodes the whole URI before splitting it on those, so a mail app
	// built on it drops everything from the first one onwards. That is why the QR code arrives
	// as `payment.qrCodeUrl`, a link whose parameters are all path segments.
	const to = recipients.map((email) => encodeURIComponent(email).replace(/%40/g, "@")).join(",");

	return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
