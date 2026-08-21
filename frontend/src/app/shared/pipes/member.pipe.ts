import { Pipe, PipeTransform } from "@angular/core";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipStates } from "src/app/core/config/membership-states";
import { getAge, getAgeLabel } from "src/helpers/age";
import { SDK } from "src/sdk";

@Pipe({
	name: "member",
})
export class MemberPipe implements PipeTransform {
	transform(
		member: SDK.MemberResponse | undefined,
		property: "nickname" | "age" | "ageLabel" | "membership" | "role" | "initials",
		referenceDate?: string | null,
	) {
		if (!member) return "";

		switch (property) {
			case "nickname":
				return member.nickname || member.firstName || member.lastName || "?";

			case "age": {
				const age = getAge(member.birthday, referenceDate);
				return age === null ? "" : String(age);
			}

			case "ageLabel":
				return getAgeLabel(member.birthday, referenceDate);

			case "membership":
				return MembershipStates[member.membership].title;

			case "role":
				return MemberRoles[member.role]?.title || member.role;

			case "initials":
				return member ? this.getInitials(member) : "";
		}
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
