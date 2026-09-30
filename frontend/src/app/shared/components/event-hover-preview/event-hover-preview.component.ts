import { afterNextRender, Component, ElementRef, input, OnDestroy, signal, viewChild } from "@angular/core";
import { SDK } from "src/sdk";
import { EventCardComponent } from "../event-card/event-card.component";

@Component({
	selector: "bo-event-hover-preview",
	templateUrl: "./event-hover-preview.component.html",
	styleUrls: ["./event-hover-preview.component.scss"],
	imports: [EventCardComponent],
})
export class EventHoverPreviewComponent implements OnDestroy {
	events = input.required<SDK.EventResponseWithLinks[]>();

	hoveredEvent = signal<SDK.EventResponseWithLinks | undefined>(undefined);
	position = signal<{ top: number; left: number } | null>(null);

	private readonly previewDelayMs = 500;
	private previewTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingEventId: number | null = null;
	private paused = false;

	private overlay = viewChild<ElementRef<HTMLElement>>("overlay");
	private overlayEl: HTMLElement | null = null;

	constructor() {
		afterNextRender(() => {
			const overlay = this.overlay()?.nativeElement;
			if (overlay) {
				this.overlayEl = overlay;
				document.body.appendChild(overlay);
			}
		});
	}

	ngOnDestroy(): void {
		this.clearTimer();
		this.overlayEl?.remove();
		this.overlayEl = null;
	}

	pause() {
		this.paused = true;
		this.clear();
	}

	resume() {
		this.paused = false;
	}

	hover(e: PointerEvent) {
		if (this.paused) return;
		if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

		const row = (e.target as HTMLElement | null)?.closest?.("[id^='event-']") as HTMLElement | null;
		if (!row) {
			this.clear();
			return;
		}

		const id = Number(row.id.slice("event-".length));
		const event = this.events().find((item) => item.id === id);
		if (!event) return;

		this.updatePosition(e);

		if (this.hoveredEvent()?.id === id || this.pendingEventId === id) return;

		this.hoveredEvent.set(undefined);
		this.pendingEventId = id;
		this.clearTimer();
		this.previewTimer = setTimeout(() => {
			this.pendingEventId = null;
			this.hoveredEvent.set(event);
		}, this.previewDelayMs);
	}

	clear() {
		this.clearTimer();
		this.pendingEventId = null;
		this.hoveredEvent.set(undefined);
	}

	private clearTimer() {
		if (this.previewTimer) {
			clearTimeout(this.previewTimer);
			this.previewTimer = null;
		}
	}

	private updatePosition(e: PointerEvent) {
		const cardWidth = 360;
		const offset = 16;
		const margin = 12;

		let left = e.clientX + offset;
		if (left + cardWidth > window.innerWidth) left = Math.max(margin, e.clientX - cardWidth - offset);

		const top = Math.max(margin, Math.min(e.clientY + offset, window.innerHeight - 240));
		this.position.set({ top, left });
	}
}
