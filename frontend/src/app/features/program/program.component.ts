import { Component, OnInit } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	IonBadge,
	IonIcon,
	IonLabel,
	IonTabBar,
	IonTabButton,
	IonTabs,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { ProgramService } from "./services/program.service";

@Component({
	selector: "bo-program",
	templateUrl: "./program.component.html",
	styleUrls: ["./program.component.scss"],

	imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class ProgramComponent implements OnInit, ViewWillEnter {
	pendingEventsCount = toSignal(this.programService.pendingEventsCount, { initialValue: 0 });

	constructor(public programService: ProgramService) {}

	ngOnInit(): void {}

	ionViewWillEnter() {
		this.programService.loadEventsCount();
	}
}
