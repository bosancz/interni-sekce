import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { Router } from "@angular/router";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { DateTime } from "luxon";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { EventAnnouncementModalComponent } from "../event-announcement-modal/event-announcement-modal.component";
import { EventAccountingModalComponent } from "../event-accounting-modal/event-accounting-modal.component";

export interface EventProgressStep {
	key: "draft" | "public" | "announcement" | "accounting" | "report";
	label: string;
	reached: boolean;
	active: boolean;
	reachedOut: boolean;
	clickable: boolean;
	note: boolean;
	accent: string;
	accentOut: string;
}

const STEPS: { key: EventProgressStep["key"]; statuses: EventStatusID[] }[] = [
	{ key: "draft", statuses: ["draft", "rejected"] },
	{ key: "public", statuses: ["public", "pending", "cancelled", "finalized"] },
];

const STEP_LABELS: Record<EventStatusID, string> = {
	draft: "V přípravě",
	pending: "Čeká na schválení",
	rejected: "Vrácená k úpravám",
	public: "V programu",
	cancelled: "Zrušená",
	finalized: "Uzavřená",
};

const NEUTRAL_COLOR = "var(--bo-line)";

const IN_PROGRESS_COLOR = EventStatuses.pending.color;

const DONE_COLOR = EventStatuses.public.color;

@Component({
	selector: "bo-event-progress",
	templateUrl: "./event-progress.component.html",
	styleUrl: "./event-progress.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [IonIcon, TooltipDirective],
})
export class EventProgressComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);

	change = output<void>();

	statusNote = computed(() => this.event()?.statusNote || undefined);

	private status = computed(() => this.event()?.status as EventStatusID | undefined);

	private noLeader = computed(() => !this.event()?.leaders?.length);

	announcementSent = computed(() => !!this.event()?.announcementSentAt);

	accountingSent = computed(() => !!this.event()?.accountingSentAt);

	reportPublished = computed(() => !!this.event()?.reportPublishedAt);

	private statusIndex = computed(() => {
		const status = this.status();
		return status ? STEPS.findIndex((step) => step.statuses.includes(status)) : -1;
	});

	private eventEnded = computed(() => {
		const dateTill = this.event()?.dateTill;
		if (!dateTill) return false;
		return DateTime.fromISO(dateTill).endOf("day") < DateTime.now();
	});

	private closureSteps = computed(() =>
		[
			{
				key: "accounting" as const,
				label: "Účtování",
				done: this.accountingSent(),
			},
			{
				key: "report" as const,
				label: "Report",
				done: this.reportPublished(),
			},
		].map((step) => ({ ...step, reached: this.announcementSent() && (step.done || this.eventEnded()) })),
	);

	private activeIndex = computed(() => {
		if (!this.announcementSent()) return this.statusIndex();

		const closureSteps = this.closureSteps();
		const pending = closureSteps.findIndex((step) => step.reached && !step.done);
		if (pending !== -1) return STEPS.length + 1 + pending;

		return STEPS.length + 1 + closureSteps.map((step) => step.reached).lastIndexOf(true);
	});

	steps = computed<EventProgressStep[]>(() => {
		const event = this.event();
		const activeIndex = this.activeIndex();

		const statusSteps = STEPS.map((step, index) => {
			const status = index === this.statusIndex() ? this.status()! : step.statuses[0];

			return {
				key: step.key,
				label: STEP_LABELS[status],
				reached: activeIndex >= index,
				clickable: false,
				note: index === this.statusIndex() && !!this.statusNote(),
				accent: this.accentColor(),
			};
		});

		const allSteps = [
			...statusSteps,
			{
				key: "announcement" as const,
				label: "Ohláška",
				reached: activeIndex >= STEPS.length,
				clickable: !!event && (this.announcementSent() || event._links.markAnnouncementSent.applicable),
				note: false,
				accent: this.accentColor(),
			},
			...this.closureSteps().map((step) => ({
				key: step.key,
				label: step.label,
				reached: step.reached,
				clickable: !!event,
				note: false,
				accent: !step.reached ? NEUTRAL_COLOR : step.done ? DONE_COLOR : IN_PROGRESS_COLOR,
			})),
		];

		return allSteps.map((step, index) => ({
			...step,
			active: index === activeIndex,
			reachedOut: step.reached && (index !== activeIndex || !!allSteps[index + 1]?.reached),
			accentOut: allSteps[index + 1]?.accent ?? step.accent,
		}));
	});

	accentColor = computed(() => {
		const status = this.status();
		if (!status) return NEUTRAL_COLOR;
		if (status === "draft") return this.noLeader() ? EventStatuses.draft.color : IN_PROGRESS_COLOR;
		return EventStatuses[status]?.color ?? NEUTRAL_COLOR;
	});

	constructor(
		private readonly api: ApiService,
		private readonly router: Router,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ chatbubbleEllipsesOutline });
	}

	async openStep(step: EventProgressStep) {
		const event = this.event();
		if (!step.clickable || !event) return;

		if (step.key === "announcement") {
			const result = await this.modalService.componentModal(
				EventAnnouncementModalComponent,
				{ event },
				{ cssClass: "dialog-brand" },
			);
			if (!result || result.sent === !!event.announcementSentAt) return;

			await this.callApi((id) =>
				result.sent
					? this.api.EventsApi.markAnnouncementSent(id)
					: this.api.EventsApi.unmarkAnnouncementSent(id),
			);
		}

		if (step.key === "accounting") {
			const result = await this.modalService.componentModal(
				EventAccountingModalComponent,
				{ event },
				{ cssClass: "dialog-brand" },
			);
			if (!result || result.sent === !!event.accountingSentAt) return;

			await this.callApi((id) =>
				result.sent ? this.api.EventsApi.markAccountingSent(id) : this.api.EventsApi.unmarkAccountingSent(id),
			);
		}

		if (step.key === "report") {
			this.router.navigate([], { queryParams: { tab: "report" }, queryParamsHandling: "merge" });
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
