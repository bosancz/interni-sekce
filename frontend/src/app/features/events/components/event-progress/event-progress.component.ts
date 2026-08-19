import { ChangeDetectionStrategy, Component, computed, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { SDK } from "src/sdk";
import { EventAnnouncementModalComponent } from "../event-announcement-modal/event-announcement-modal.component";
import { EventClosureModalComponent } from "../event-closure-modal/event-closure-modal.component";

export interface EventProgressStep {
	key: "draft" | "pending" | "public" | "announcement" | "closure";
	label: string;
	reached: boolean;
	active: boolean;
	clickable: boolean;
	note: boolean;
}

export interface EventClosureItem {
	key: string;
	label: string;
	done: boolean;
}

const STEPS: { key: EventProgressStep["key"]; statuses: EventStatusID[] }[] = [
	{ key: "draft", statuses: ["draft"] },
	{ key: "pending", statuses: ["pending", "rejected"] },
	{ key: "public", statuses: ["public", "cancelled", "finalized"] },
];

const STEP_LABELS: Record<EventStatusID, string> = {
	draft: "V přípravě",
	pending: "Čeká na schválení",
	rejected: "Vrácená k úpravám",
	public: "V programu",
	cancelled: "Zrušená",
	finalized: "Uzavřená",
};

const NO_LEADER_LABEL = "Bez vedoucího";

@Component({
	selector: "bo-event-progress",
	templateUrl: "./event-progress.component.html",
	styleUrl: "./event-progress.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [IonIcon, IonPopover, IonContent],
})
export class EventProgressComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);

	change = output<void>();

	noteOpen = signal(false);
	noteEvent = signal<Event | undefined>(undefined);

	statusNote = computed(() => this.event()?.statusNote || undefined);

	private status = computed(() => this.event()?.status as EventStatusID | undefined);

	private noLeader = computed(() => !this.event()?.leaders?.length);

	announcementSent = computed(() => !!this.event()?.announcementSentAt);

	closureItems = computed<EventClosureItem[]>(() => {
		const event = this.event();
		const album = event?.album;

		return [
			{ key: "accounting", label: "Vyúčtování odesláno", done: !!event?.accountingSentAt },
			{ key: "report", label: "Report vyplněn", done: !!event?.report },
			{
				key: "album",
				label: !album
					? "Bez galerie"
					: album.status === "public"
						? "Galerie zveřejněna"
						: "Galerie nezveřejněná",
				done: album?.status === "public",
			},
		];
	});

	closureCount = computed(() => this.closureItems().filter((item) => item.done).length);

	private statusIndex = computed(() => {
		const status = this.status();
		return status ? STEPS.findIndex((step) => step.statuses.includes(status)) : -1;
	});

	private activeIndex = computed(() => {
		if (!this.announcementSent()) return this.statusIndex();
		return this.closureCount() === this.closureItems().length ? STEPS.length + 1 : STEPS.length;
	});

	steps = computed<EventProgressStep[]>(() => {
		const event = this.event();

		const statusSteps = STEPS.map((step, index) => {
			const status = index === this.statusIndex() ? this.status()! : step.statuses[0];
			const noLeader = index === this.statusIndex() && status === "draft" && this.noLeader();

			return {
				key: step.key,
				label: noLeader ? NO_LEADER_LABEL : STEP_LABELS[status],
				reached: this.activeIndex() >= index,
				active: index === this.activeIndex(),
				clickable: false,
				note: index === this.statusIndex() && !!this.statusNote(),
			};
		});

		return [
			...statusSteps,
			{
				key: "announcement" as const,
				label: "Ohláška odeslána",
				reached: this.activeIndex() >= STEPS.length,
				active: this.activeIndex() === STEPS.length,
				clickable: !!event && (this.announcementSent() || event._links.markAnnouncementSent.applicable),
				note: false,
			},
			{
				key: "closure" as const,
				label: `Uzavření ${this.closureCount()}/${this.closureItems().length}`,
				reached: this.activeIndex() >= STEPS.length + 1,
				active: this.activeIndex() === STEPS.length + 1,
				clickable: !!event,
				note: false,
			},
		];
	});

	noteLabel = computed(() => this.steps().find((step) => step.note)?.label);

	accentColor = computed(() => {
		const status = this.status();
		if (!status) return "var(--bo-line)";
		if (status === "draft" && this.noLeader()) return EventStatuses.cancelled.color;
		return EventStatuses[status]?.color ?? "var(--bo-line)";
	});

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ chatbubbleEllipsesOutline });
	}

	openNote(domEvent: Event) {
		domEvent.stopPropagation();
		this.noteEvent.set(domEvent);
		this.noteOpen.set(true);
	}

	async openStep(step: EventProgressStep) {
		const event = this.event();
		if (!step.clickable || !event) return;

		if (step.key === "announcement") {
			const result = await this.modalService.componentModal(EventAnnouncementModalComponent, { event });
			if (!result || result.sent === !!event.announcementSentAt) return;

			await this.callApi((id) =>
				result.sent
					? this.api.EventsApi.markAnnouncementSent(id)
					: this.api.EventsApi.unmarkAnnouncementSent(id),
			);
		}

		if (step.key === "closure") {
			const result = await this.modalService.componentModal(EventClosureModalComponent, { event });
			if (!result || result.accountingSent === !!event.accountingSentAt) return;

			await this.callApi((id) =>
				result.accountingSent
					? this.api.EventsApi.markAccountingSent(id)
					: this.api.EventsApi.unmarkAccountingSent(id),
			);
		}
	}

	private async callApi(action: (eventId: number) => Promise<unknown>) {
		const event = this.event();
		if (!event) return;

		try {
			await action(event.id);
			this.toastService.toast("Uloženo.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit změnu.", { color: "danger" });
		}
	}
}
