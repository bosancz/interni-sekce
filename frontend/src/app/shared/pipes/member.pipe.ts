import { Pipe, PipeTransform } from "@angular/core";
import { MemberResponse } from "src/app/api";

@Pipe({
  name: "member",
})
export class MemberPipe implements PipeTransform {
  transform(member: MemberResponse | undefined, property: "nickname") {
    if (!member) return "";

    switch (property) {
      case "nickname":
        return member.nickname || member.firstName || member.lastName || "?";
    }
  }
}
