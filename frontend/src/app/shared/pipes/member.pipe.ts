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
		property: "nickname" | "age" | "membership" | "role" | "initials",
	) {
		if (!member) return "";

		switch (property) {
			case "nickname":
				return member.nickname || member.firstName || member.lastName || "?";

			case "age":
				let birthday: DateTime | string | null | undefined = member.birthday;

				if (!birthday) return "";

				if (typeof birthday === "string") birthday = DateTime.fromISO(birthday);

				return String(Math.floor(birthday.diffNow("years").years * -1));

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
		return value.match(/^(Ch|[\p{L}\p{N}_])/u)?.[0] || "";
	}
}
