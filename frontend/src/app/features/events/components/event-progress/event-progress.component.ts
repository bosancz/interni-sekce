import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { Router } from "@angular/router";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { DateTime } from "luxon";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { EventTypes } from "src/app/core/config/event-types";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { EventClosureModalComponent } from "../event-closure-modal/event-closure-modal.component";

export interface EventProgressStep {
	key: "draft" | "public" | "announcement" | "event" | "closure";
	label: string;
	reached: boolean;
	active: boolean;
	reachedOut: boolean;
	clickable: boolean;
	note: boolean;
	accent: string;
	accentOut: string;
	image?: string;
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

const CLOSURE_ITEMS = 3;

@Component({
	selector: "bo-event-progress",
	templateUrl: "./event-progress.component.html",
	styleUrl: "./event-progress.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [IonIcon, TooltipDirective],
})
export class EventProgressComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);

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

	private typeImage = computed(() => {
		const type = this.event()?.type;
		return type && type in EventTypes ? EventTypes[type as keyof typeof EventTypes].image : undefined;
	});

	private eventStarted = computed(() => {
		const dateFrom = this.event()?.dateFrom;
		if (!dateFrom) return false;
		return DateTime.fromISO(dateFrom).startOf("day") <= DateTime.now();
	});

	private eventEnded = computed(() => {
		const dateTill = this.event()?.dateTill;
		if (!dateTill) return false;
		return DateTime.fromISO(dateTill).endOf("day") < DateTime.now();
	});

	galleryPublished = computed(() => this.event()?.album?.status === "public");

	private closureDone = computed(
		() => [this.accountingSent(), this.reportPublished(), this.galleryPublished()].filter(Boolean).length,
	);

	private closureReached = computed(() => this.announcementSent() && (this.eventEnded() || this.closureDone() > 0));

	private activeIndex = computed(() => {
		if (!this.announcementSent()) return this.statusIndex();
		if (this.closureReached()) return STEPS.length + 2;
		return this.eventStarted() ? STEPS.length + 1 : STEPS.length;
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
				clickable: !!event,
				note: false,
				accent: this.accentColor(),
			},
			{
				key: "event" as const,
				label: "Akce",
				image: this.typeImage(),
				reached: this.eventStarted(),
				clickable: false,
				note: false,
				accent: !this.eventStarted() ? NEUTRAL_COLOR : this.eventEnded() ? DONE_COLOR : IN_PROGRESS_COLOR,
			},
			{
				key: "closure" as const,
				label: `Uzavření\u00a0${this.closureDone()}/${CLOSURE_ITEMS}`,
				reached: this.closureReached(),
				clickable: !!event,
				note: false,
				accent: !this.closureReached()
					? NEUTRAL_COLOR
					: this.closureDone() === CLOSURE_ITEMS
						? DONE_COLOR
						: IN_PROGRESS_COLOR,
			},
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
		private readonly router: Router,
		private readonly modalService: ModalService,
	) {
		addIcons({ chatbubbleEllipsesOutline });
	}

	async openStep(step: EventProgressStep) {
		const event = this.event();
		if (!step.clickable || !event) return;

		if (step.key === "announcement") {
			this.openTab("attendees");
		}

		if (step.key === "closure") {
			const item = await this.modalService.componentModal(
				EventClosureModalComponent,
				{ event },
				{ cssClass: "dialog-brand" },
			);
			if (item) this.openTab(item);
		}
	}

	private openTab(tab: string) {
		this.router.navigate([], { queryParams: { tab }, queryParamsHandling: "merge" });
	}
}
