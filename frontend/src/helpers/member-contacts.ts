import { SDK } from "src/sdk";

export function getDefaultContact(contacts?: SDK.MemberContact[] | null): SDK.MemberContact | undefined {
	if (!contacts?.length) return undefined;
	return contacts.find((contact) => contact.isDefault) ?? contacts[0];
}

export function getMemberEmails(member?: SDK.MemberResponse | null): string[] {
	if (!member) return [];

	const emails =
		member.role === SDK.MemberRolesEnum.Dite
			? (getDefaultContact(member.contacts)?.email ?? [])
			: [member.email ?? ""];

	return emails.map((email) => email.trim()).filter((email) => !!email);
}
