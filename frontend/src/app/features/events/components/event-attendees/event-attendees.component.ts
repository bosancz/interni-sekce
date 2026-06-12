import { CommonModule } from "@angular/common";
import { Component, effect, input, OnDestroy, OnInit, output, signal } from "@angular/core";
import { IonButton } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { SDK } from "src/sdk";
import { EventAttendeesListComponent } from "../event-attendees-list/event-attendees-list.component";

@UntilDestroy()
@Component({
	selector: "bo-event-attendees",
	templateUrl: "./event-attendees.component.html",
	styleUrls: ["./event-attendees.component.scss"],

	imports: [CommonModule, IonButton, EventAttendeesListComponent, AddButtonComponent],
})
export class EventAttendeesComponent implements OnInit, OnDestroy {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	change = output<void>();

	attendees = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);
	leaders = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);

	actions: Action[] = [];

	modal?: HTMLIonModalElement;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		effect(() => {
			const event = this.event();
			this.loadAttendees(event);
		});
	}

	ngOnInit(): void {}

	ngOnDestroy() {
		this.modal?.dismiss();
	}

	private async loadAttendees(event?: SDK.EventResponseWithLinks | null) {
		if (!event) {
			this.attendees.set(undefined);
			this.leaders.set(undefined);
			return;
		}

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

		attendees.sort((a, b) => {
			if (!a.member || !b.member) return 0;

			const aString = [a.member.nickname, a.member.firstName, a.member.lastName].join(" ");
			const bString = [b.member.nickname, b.member.firstName, b.member.lastName].join(" ");

			return b.member.role.localeCompare(a.member.role) || aString.localeCompare(bString);
		});

		this.attendees.set(attendees.filter((a) => a.type === "attendee"));
		this.leaders.set(attendees.filter((a) => a.type === "leader"));
	}

	async addAttendee(type: SDK.EventAttendeeCreateBodyTypeEnum) {
		const event = this.event();
		if (!event) return;

		const addSelectedMember = async (member?: SDK.MemberResponse | null) => {
			if (!member?.id) return;

			try {
				const existingAttendee = [...(this.attendees() ?? []), ...(this.leaders() ?? [])].find(
					(item) => item.member && item.member.id === member.id,
				);
				if (existingAttendee && existingAttendee.type === type) {
					this.toastService.toast("Účastník už v seznamu je.");
					return;
				}

				if (existingAttendee) {
					await this.api.EventsApi.updateEventAttendee(event.id, member.id, { type });
				} else {
					await this.api.EventsApi.addEventAttendee(event.id, member.id, { type });
				}

				this.toastService.toast("Účastník přidán.");
			} catch (e) {
				this.toastService.toast("Nepodařilo se přidat účastníka." + e);
			}

			await this.loadAttendees(event);

			this.change.emit();
		};

		await this.modalService.componentModal(MemberSelectorModalComponent, {
			keepOpenAfterSelect: true,
			onSelect: (member: SDK.MemberResponse) => void addSelectedMember(member),
		});
	}

	async removeAttendee(attendee: SDK.EventAttendeeResponseWithLinks) {
		const event = this.event();
		if (!event) return;

		if (attendee.type === "leader") {
			const confirmation = await this.modalService.deleteConfirmationModal(
				"Opravdu chcete odebrat vedoucího akce?",
			);
			if (!confirmation) return;
		}

		try {
			// optimistic update
			this.attendees.set(this.attendees()?.filter((item) => item.memberId !== attendee.memberId));

			await this.api.EventsApi.deleteEventAttendee(event.id, attendee.memberId);

			if (attendee.type === "leader") this.toastService.toast("Vedoucí odebrán.");
			else this.toastService.toast("Účastník odebrán.");

			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat účastníka.");
			this.attendees.set([...(this.attendees() ?? []), attendee]); // rollback
		}
	}

	toggleSliding(sliding: any) {
		sliding.getOpenAmount().then((open: number) => {
			if (open) sliding.close();
			else sliding.open();
		});
	}

	async getAnnouncement(event: SDK.EventResponseWithLinks) {
		if (!event) return;

		try {
			const res = (await this.api.EventsApi.getEventAnnouncement(event.id, { responseType: "blob" })) as any;

			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const fileName = res.headers["content-disposition"]?.match(/filename="?([^";]+)"?/)?.[1] ?? "ohlaska.xlsx";

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			this.toastService.toast("Nepodařilo se stáhnout ohlášku.", { color: "danger" });
		}
	}
}
