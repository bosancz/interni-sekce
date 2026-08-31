import { Pipe, PipeTransform } from "@angular/core";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { membershipState } from "src/app/core/helpers/membership";
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
				// The membership of the current year — see core/helpers/membership.ts.
				return MembershipPaymentStates[membershipState(member.membership)].title;

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
