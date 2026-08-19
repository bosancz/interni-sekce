import { ChangeDetectionStrategy, Component, computed, input, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { SDK } from "src/sdk";

export interface EventProgressStep {
	key: string;
	label: string;
	reached: boolean;
	active: boolean;
}

const STEPS: { key: string; statuses: EventStatusID[] }[] = [
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

	noteOpen = signal(false);
	noteEvent = signal<Event | undefined>(undefined);

	statusNote = computed(() => this.event()?.statusNote || undefined);

	private status = computed(() => this.event()?.status as EventStatusID | undefined);

	private noLeader = computed(() => !this.event()?.leaders?.length);

	private activeIndex = computed(() => {
		const status = this.status();
		return status ? STEPS.findIndex((step) => step.statuses.includes(status)) : -1;
	});

	steps = computed<EventProgressStep[]>(() =>
		STEPS.map((step, index) => {
			const active = index === this.activeIndex();
			const status = active ? this.status()! : step.statuses[0];

			return {
				key: step.key,
				label: active && status === "draft" && this.noLeader() ? NO_LEADER_LABEL : STEP_LABELS[status],
				reached: this.activeIndex() >= index,
				active,
			};
		}),
	);

	activeLabel = computed(() => this.steps().find((step) => step.active)?.label);

	accentColor = computed(() => {
		const status = this.status();
		if (!status) return "var(--bo-line)";
		if (status === "draft" && this.noLeader()) return EventStatuses.cancelled.color;
		return EventStatuses[status]?.color ?? "var(--bo-line)";
	});

	constructor() {
		addIcons({ chatbubbleEllipsesOutline });
	}

	openNote(event: Event) {
		this.noteEvent.set(event);
		this.noteOpen.set(true);
	}
}
