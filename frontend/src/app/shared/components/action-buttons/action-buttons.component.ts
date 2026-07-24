import { Component, effect, input, OnInit, output, signal } from "@angular/core";
import { ActionSheetController, IonButton, IonIcon, IonText } from "@ionic/angular/standalone";
import { ActionSheetButton, PredefinedColors } from "@ionic/core";
import { addIcons } from "ionicons";
import { ellipsisVertical } from "ionicons/icons";
import { PlatformService } from "src/app/core/services/platform.service";

export interface Action extends ActionSheetButton {
	disabled?: boolean;
	hidden?: boolean;
	pinned?: boolean;
	color?: PredefinedColors;
}

@Component({
	selector: "bo-action-buttons",
	templateUrl: "./action-buttons.component.html",
	styleUrls: ["./action-buttons.component.scss"],

	imports: [IonButton, IonIcon, IonText],
})
export class ActionButtonsComponent implements OnInit {
	actions = input<Action[]>([]);
	header = input<string | null | undefined>();
	subHeader = input<string | null | undefined>();

	close = output<void>();

	pinned = signal<Action[]>([]);
	buttons = signal<Action[]>([]);
	menu = signal<Action[]>([]);

	desktop = true;
	ios = this.platformService.isIos.value;

	open = false;

	constructor(
		private platformService: PlatformService,
		private actionsController: ActionSheetController,
	) {
		addIcons({ ellipsisVertical });
		effect(() => {
			let actions = this.actions();
			actions = this.filterActions(actions);

			this.pinned.set(actions.filter((item) => item.pinned));

			this.buttons.set(actions.filter((item) => !item.pinned));

			if (actions.filter((item) => !item.pinned).length) {
				// disabled actions stay in the menu (rendered disabled) so the user sees what is possible but not permitted
				const menu = actions.filter((item) => item.text && !item.pinned);

				if (!menu.some((item) => item.role === "cancel") && this.platformService.isIos.value) {
					menu.push({
						text: "Zrušit",
						role: "cancel",
						icon: "close-outline",
					});
				}

				this.menu.set(menu);
			} else {
				this.menu.set([]);
			}
		});
	}

	ngOnInit(): void {}

	async openActions() {
		let buttons = this.menu();

		if (this.platformService.isIos.value) buttons = buttons.map((item) => ({ ...item, icon: undefined }));

		buttons.sort((a, b) => {
			if (a.role === "destructive" && b.role !== "destructive") return -1;
			else if (a.role !== "destructive" && b.role === "destructive") return 1;
			else return 0;
		});

		const actionSheet = await this.actionsController.create({
			buttons: buttons,
			header: this.header() ?? undefined,
			subHeader: this.subHeader() ?? undefined,
		});

		actionSheet.present();
	}

	onClick(action: Action) {
		action.handler?.();
	}

	private filterActions(actions: Action[]) {
		return actions.filter((item) => !item.hidden);
	}
}
