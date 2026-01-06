import { Component, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButtons } from "@ionic/angular/standalone";
import { PlatformService } from "src/app/core/services/platform.service";
import { Action, ActionButtonsComponent } from "../action-buttons/action-buttons.component";

@Component({
	selector: "bo-page-header",
	templateUrl: "./page-header.component.html",
	styleUrls: ["./page-header.component.scss"],

	imports: [IonButtons, ActionButtonsComponent],
})
export class PageHeaderComponent {
	title = input<string | null | undefined>();
	actions = input<Action[] | undefined>();

	isLg = toSignal(this.platformService.isLg);
	isIos = toSignal(this.platformService.isIos);

	viewActive: boolean = false;

	constructor(private readonly platformService: PlatformService) {}
}
