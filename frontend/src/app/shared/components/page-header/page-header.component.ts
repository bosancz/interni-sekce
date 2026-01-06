import { Component, Input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButtons } from "@ionic/angular/standalone";
import { PlatformService } from "src/app/services/platform.service";
import { Action, ActionButtonsComponent } from "../action-buttons/action-buttons.component";

@Component({
	selector: "bo-page-header",
	templateUrl: "./page-header.component.html",
	styleUrls: ["./page-header.component.scss"],
	standalone: true,
	imports: [IonButtons, ActionButtonsComponent],
})
export class PageHeaderComponent {
	@Input() title?: string | null;
	@Input() actions?: Action[];

	isLg = toSignal(this.platformService.isLg);
	isIos = toSignal(this.platformService.isIos);

	viewActive: boolean = false;

	constructor(private readonly platformService: PlatformService) {}
}
