import { Component, Input } from "@angular/core";
import { MemberResponseWithLinks } from "src/app/api";

@Component({
    selector: "bo-member-profile",
    templateUrl: "./member-profile.component.html",
    styleUrl: "./member-profile.component.scss",
    standalone: false
})
export class MemberProfileComponent {
  @Input() member?: MemberResponseWithLinks | null;
}
