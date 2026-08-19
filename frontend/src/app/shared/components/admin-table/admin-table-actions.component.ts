import { Component, computed, HostListener, input, signal } from "@angular/core";
import {
	ActionSheetController,
	IonButton,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { ellipsisVertical } from "ionicons/icons";
import { PlatformService } from "src/app/core/services/platform.service";
import { Action } from "../action-buttons/action-buttons.component";

@Component({
	selector: "[admin-table-actions]",
	template: `
		@if (visibleActions().length) {
			<ion-button fill="clear" size="small" (click)="openActions($event)">
				<ion-icon slot="icon-only" name="ellipsis-vertical"></ion-icon>
			</ion-button>

			<ion-popover
				[isOpen]="popoverOpen()"
				[event]="popoverEvent()"
				[dismissOnSelect]="true"
				(didDismiss)="popoverOpen.set(false)"
			>
				<ng-template>
					<ion-list lines="full">
						@for (action of menuActions(); track action.text) {
							<ion-item button detail="false" [disabled]="action.disabled" (click)="runAction(action)">
								@if (action.icon) {
									<ion-icon slot="start" [icon]="action.icon" [color]="action.color"></ion-icon>
								}
								<ion-label [color]="action.color">{{ action.text }}</ion-label>
							</ion-item>
						}
					</ion-list>
				</ng-template>
			</ion-popover>
		}
	`,
	styles: [
		`
			:host {
				width: 1%;
				white-space: nowrap;
				text-align: center;
			}
			ion-button {
				--padding-start: 0.25rem;
				--padding-end: 0.25rem;
				margin: 0;
				height: 1.75rem;
			}
		`,
	],
	imports: [IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel],
})
export class AdminTableActionsComponent {
	actions = input<Action[]>([]);
	header = input<string | null | undefined>();
	subHeader = input<string | null | undefined>();

	visibleActions = computed(() => this.actions().filter((action) => !action.hidden));
	menuActions = computed(() => this.visibleActions().filter((action) => action.text));

	popoverOpen = signal(false);
	popoverEvent = signal<Event | undefined>(undefined);

	constructor(
		private platformService: PlatformService,
		private actionSheetController: ActionSheetController,
	) {
		addIcons({ ellipsisVertical });
	}

	@HostListener("click", ["$event"])
	onHostClick(event: Event) {
		event.stopPropagation();
	}

	async openActions(event: Event) {
		event.stopPropagation();
		event.preventDefault();

		if (this.platformService.isLg.value) {
			this.popoverEvent.set(event);
			this.popoverOpen.set(true);
		} else {
			await this.openActionSheet();
		}
	}

	runAction(action: Action) {
		this.popoverOpen.set(false);
		if (!action.disabled) action.handler?.();
	}

	private async openActionSheet() {
		let buttons = this.menuActions().filter((action) => !action.disabled);

		if (this.platformService.isIos.value) buttons = buttons.map((item) => ({ ...item, icon: undefined }));

		buttons.sort((a, b) => {
			if (a.role === "destructive" && b.role !== "destructive") return -1;
			else if (a.role !== "destructive" && b.role === "destructive") return 1;
			else return 0;
		});

		if (!buttons.some((item) => item.role === "cancel") && this.platformService.isIos.value) {
			buttons.push({ text: "Zrušit", role: "cancel", icon: "close-outline" });
		}

		const actionSheet = await this.actionSheetController.create({
			buttons,
			header: this.header() ?? undefined,
			subHeader: this.subHeader() ?? undefined,
		});

		actionSheet.present();
	}
}
