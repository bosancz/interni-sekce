import { DateTime } from "luxon";

export interface BirthdayMember {
	id: number;
	nickname?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	birthday?: string | null;
}

export function getBirthdayDays(date: DateTime) {
	const days = [date.day];
	if (date.month === 2 && date.day === 28 && !date.isInLeapYear) days.push(29);
	return { month: date.month, days };
}

export function getBirthdayAge(birthday: string | null | undefined, date: DateTime) {
	return birthday ? date.year - DateTime.fromISO(birthday).year : null;
}

export function formatYears(age: number) {
	if (age === 1) return "1 rok";
	if (age >= 2 && age <= 4) return `${age} roky`;
	return `${age} let`;
}

export function formatBirthdayMember(member: BirthdayMember, date: DateTime) {
	const name =
		member.nickname || [member.firstName, member.lastName].filter(Boolean).join(" ") || `Člen ${member.id}`;
	const age = getBirthdayAge(member.birthday, date);
	return age === null ? name : `${name} (${formatYears(age)})`;
}

export function formatBirthdaysBody(members: BirthdayMember[], date: DateTime) {
	const names = members.map((member) => formatBirthdayMember(member, date));
	const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} a ${names[names.length - 1]}` : names[0];
	return `Dnes slaví ${list}.`;
}
