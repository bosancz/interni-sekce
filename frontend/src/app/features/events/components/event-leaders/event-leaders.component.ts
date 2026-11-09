import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, computed, effect, input, OnDestroy, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { reorderTwo } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { RolePipe } from "src/app/shared/pipes/role.pipe";
import { SDK } from "src/sdk";
import { MemberSelectorModalComponent } from "../member-selector-modal/member-selector-modal.component";

const LEADER_ROLES: SDK.MemberRolesEnum[] = [SDK.MemberRolesEnum.Instruktor, SDK.MemberRolesEnum.Vedouci];

const compareLeaderPositions = (a: SDK.EventAttendeeResponseWithLinks, b: SDK.EventAttendeeResponseWithLinks) =>
	(a.position ?? Infinity) - (b.position ?? Infinity) ||
	(a.member?.nickname ?? "").localeCompare(b.member?.nickname ?? "", "cs") ||
	a.memberId - b.memberId;

@Component({
	selector: "bo-event-leaders",
	templateUrl: "./event-leaders.component.html",
	styleUrl: "./event-leaders.component.scss",
	imports: [
		RouterLink,
		CdkDropList,
		CdkDrag,
		CdkDragHandle,
		IonIcon,
		IonSkeletonText,
		TooltipDirective,
		GroupPipe,
		MemberPipe,
		MemberProfilePhotoUrlPipe,
		RolePipe,
	],
})
export class EventLeadersComponent implements OnDestroy {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	change = output<void>();

	attendees = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);

	leaders = computed(() =>
		this.attendees()
			?.filter((a) => a.type === "leader")
			.sort(compareLeaderPositions),
	);

	canEdit = computed(() => this.event()?._links?.addEventLeader?.allowed ?? false);
	canReorder = computed(() => this.event()?._links?.updateEventLeadersOrder?.allowed ?? false);
	reorderable = computed(() => this.canReorder() && (this.leaders()?.length ?? 0) > 1);

	private modal?: HTMLIonModalElement;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ reorderTwo });
		effect(() => {
			this.load(this.event());
		});
	}

	ngOnDestroy() {
		this.modal?.dismiss();
	}

	private async load(event?: SDK.EventResponseWithLinks | null) {
		if (!event) {
			this.attendees.set(undefined);
			return;
		}

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);
		if (this.event()?.id === event.id) this.attendees.set(attendees);
	}

	async edit() {
		const event = this.event();
		if (!event || !this.canEdit()) return;

		const selectedIds = computed(() => (this.leaders() ?? []).map((leader) => leader.memberId));

		const reload = async () => {
			await this.load(event);
			this.change.emit();
		};

		const onSelect = async (member: SDK.MemberResponse) => {
			try {
				await this.api.EventsApi.addEventLeader(event.id, member.id);
			} catch (e) {
				this.toastService.toast("Nepodařilo se přidat vedoucího.", { color: "danger" });
				return;
			}
			await reload();
		};

		const onDeselect = async (member: SDK.MemberResponse) => {
			const leader = this.leaders()?.find((l) => l.memberId === member.id);
			if (!leader) return;

			if (!leader._links.deleteEventAttendee.allowed) {
				this.toastService.toast("Tohoto vedoucího nemůžeš odebrat.", { color: "danger" });
				return;
			}

			const name = member.nickname || member.firstName || member.lastName;
			const confirmation = await this.modalService.deleteConfirmationModal(
				name ? `Opravdu chcete odebrat vedoucího akce ${name}?` : "Opravdu chcete odebrat vedoucího akce?",
				{ header: "Odebrat vedoucího?", buttonText: "Odebrat" },
			);
			if (!confirmation) return;

			try {
				await this.api.EventsApi.deleteEventAttendee(event.id, member.id);
			} catch (e) {
				this.toastService.toast("Nepodařilo se odebrat vedoucího.", { color: "danger" });
				return;
			}
			await reload();
		};

		const onClearAll = async () => {
			const removable = (this.leaders() ?? []).filter((leader) => leader._links.deleteEventAttendee.allowed);
			if (!removable.length) return;

			const confirmation = await this.modalService.deleteConfirmationModal(
				"Opravdu chcete odebrat všechny vedoucí akce?",
				{ header: "Odebrat vše?", buttonText: "Odebrat" },
			);
			if (!confirmation) return;

			try {
				for (const leader of removable) {
					await this.api.EventsApi.deleteEventAttendee(event.id, leader.memberId);
				}
			} catch (e) {
				this.toastService.toast("Nepodařilo se odebrat vedoucí.", { color: "danger" });
			}
			await reload();
		};

		await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				keepOpenAfterSelect: true,
				allowCreate: true,
				roles: LEADER_ROLES,
				title: "Vedoucí akce",
				subtitle: "Vyber vedoucí a instruktory ze svého oddílu.",
				selectedIds,
				onSelect,
				onDeselect,
				onClearAll,
			},
			{ cssClass: "dialog-picker" },
		);
	}

	async drop(drop: CdkDragDrop<unknown>) {
		const event = this.event();
		const leaders = this.leaders();
		if (!event || !leaders || drop.previousIndex === drop.currentIndex) return;

		const ordered = [...leaders];
		moveItemInArray(ordered, drop.previousIndex, drop.currentIndex);
		const positions = new Map(ordered.map((leader, position) => [leader.memberId, position]));

		this.attendees.set(
			this.attendees()?.map((a) =>
				positions.has(a.memberId) ? { ...a, position: positions.get(a.memberId)! } : a,
			),
		);

		try {
			await this.api.EventsApi.updateEventLeadersOrder(event.id, { memberIds: ordered.map((l) => l.memberId) });
		} catch (e) {
			this.toastService.toast("Nepodařilo se změnit pořadí vedoucích.", { color: "danger" });
			await this.load(event);
			return;
		}

		this.change.emit();
	}
}
