import { Pipe, PipeTransform } from "@angular/core";
import { DateTime } from "luxon";
import { MemberResponse } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { MembershipStates } from "src/app/config/membership-states";

@Pipe({
  name: "member",
})
export class MemberPipe implements PipeTransform {
  transform(member: MemberResponse | undefined, property: "nickname" | "age" | "membership" | "role" | "initials") {
    if (!member) return "";

    switch (property) {
      case "nickname":
        return member.nickname || member.firstName || member.lastName || "?";

      case "age":
        let birthday: DateTime | string | undefined = member.birthday;

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

  getInitials(member: MemberResponse): string {
    return this.getFirstLetterLocal(member.firstName || "") + this.getFirstLetterLocal(member.lastName || "");
  }

  getFirstLetterLocal(value: string): string {
    return value.match(/^(Ch|\w)/)?.[0] || "";
  }
}
