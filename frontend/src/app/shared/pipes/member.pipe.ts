import { Pipe, PipeTransform } from "@angular/core";
import { Member } from "src/app/schema/member";

@Pipe({
  name: "member",
})
export class MemberPipe implements PipeTransform {
  transform(member: Member, property: "nickname") {
    switch (property) {
      case "nickname":
        return member.nickname || member.name?.first || member.name?.last || "?";
    }
  }
}
