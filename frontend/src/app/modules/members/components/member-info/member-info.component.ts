import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
	selector: "bo-member-info",
	templateUrl: "./member-info.component.html",
	styleUrls: ["./member-info.component.scss"],
	standalone: false,
})
export class MemberInfoComponent {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<BackendApiTypes.MemberResponse>>();
}
