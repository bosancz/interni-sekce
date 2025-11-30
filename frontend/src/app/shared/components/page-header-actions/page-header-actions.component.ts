import { Component, Input } from "@angular/core";
import { Action } from "../action-buttons/action-buttons.component";

@Component({
	selector: "bo-page-header-actions",
	standalone: false,
	templateUrl: "./page-header-actions.component.html",
	styleUrl: "./page-header-actions.component.scss",
})
export class PageHeaderActionsComponent {
	@Input() actions?: Action[];
	@Input() actionsHeader?: string | null;
}
