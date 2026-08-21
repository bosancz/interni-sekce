import { Pipe, PipeTransform } from "@angular/core";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipStates } from "src/app/core/config/membership-states";
import { SDK } from "src/sdk";

@Pipe({
	name: "member",
})
export class MemberPipe implements PipeTransform {
	transform(
		member: SDK.MemberResponse | undefined,
		property: "nickname" | "age" | "ageLabel" | "membership" | "role" | "initials",
		referenceDate?: string | DateTime | null,
	) {
		if (!member) return "";

		switch (property) {
			case "nickname":
				return member.nickname || member.firstName || member.lastName || "?";

			case "age": {
				const age = this.getAge(member, referenceDate);
				return age === null ? "" : String(age);
			}

			case "ageLabel": {
				const age = this.getAge(member, referenceDate);
				if (age === null) return "";
				return `${age} ${age === 1 ? "rok" : age < 5 ? "roky" : "let"}`;
			}

			case "membership":
				return MembershipStates[member.membership].title;

			case "role":
				return MemberRoles[member.role]?.title || member.role;

			case "initials":
				return member ? this.getInitials(member) : "";
		}
	}

	getAge(member: SDK.MemberResponse, referenceDate?: string | DateTime | null): number | null {
		if (!member.birthday) return null;

		const birthday = DateTime.fromISO(member.birthday);
		if (!birthday.isValid) return null;

		const reference = typeof referenceDate === "string" ? DateTime.fromISO(referenceDate) : referenceDate;
		const to = reference?.isValid ? reference : DateTime.now();

		return Math.floor(to.diff(birthday, "years").years);
	}

	getInitials(member: SDK.MemberResponse): string {
		return member.nickname
			? this.getFirstLetterLocal(member.nickname)
			: member.firstName
				? this.getFirstLetterLocal(member.firstName)
				: member.lastName
					? this.getFirstLetterLocal(member.lastName)
					: "?";
	}

	getFirstLetterLocal(value: string): string {
		return value.match(/^(Ch|[\p{L}\p{N}])/u)?.[0] || "";
	}
}
