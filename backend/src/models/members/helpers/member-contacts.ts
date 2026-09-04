export interface SortableContact {
	id: number;
	isDefault: boolean;
}

export function sortMemberContacts<T extends SortableContact>(contacts: T[]): T[] {
	return [...contacts].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id);
}

export function getDefaultMemberContact<T extends SortableContact>(contacts?: T[] | null): T | undefined {
	if (!contacts?.length) return undefined;
	return contacts.find((contact) => contact.isDefault) ?? sortMemberContacts(contacts)[0];
}
