import { Component, Input } from "@angular/core";
import { GroupResponse } from "src/app/api";

@Component({
    selector: "bo-group-badge",
    templateUrl: "./group-badge.component.html",
    styleUrl: "./group-badge.component.scss",
    standalone: false
})
export class GroupBadgeComponent {
  @Input() groupId!: GroupResponse["id"];
  @Input() short = false;
}
