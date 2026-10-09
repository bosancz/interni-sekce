import { DecimalPipe } from "@angular/common";
import { Component, computed, DestroyRef, effect, ElementRef, input, output, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

const WHEEL_ROW_PX = 100;
const TOUCH_ROW_PX = 60;

type GridEntry =
	| { type: "hit"; hit: SDK.PhotoContentSearchHitResponse; index: number }
	| { type: "gap"; index: number; count: number };

@Component({
	selector: "bo-photo-hits-grid",
	templateUrl: "./photo-hits-grid.component.html",
	styleUrl: "./photo-hits-grid.component.scss",
	imports: [DecimalPipe, RouterLink, PhotoImageUrlPipe, TooltipDirective],
})
export class PhotoHitsGridComponent {
	hits = input.required<SDK.PhotoContentSearchHitResponse[]>();
	threshold = input<number | null>(null);
	showScore = input(true);
	loading = input(false);
	collapse = input(false);
	adjustable = input(false);

	thresholdChange = output<number>();

	grid = viewChild<ElementRef<HTMLElement>>("grid");
	columns = signal(1);

	cutoffIndex = computed(() => {
		const threshold = this.threshold();
		if (threshold === null) return -1;
		const index = this.hits().findIndex((hit) => hit.score < threshold);
		return index === -1 ? this.hits().length : index;
	});

	entries = computed<GridEntry[]>(() => {
		const hits = this.hits();
		const cutoff = this.cutoffIndex();
		const all = (): GridEntry[] => hits.map((hit, index) => ({ type: "hit", hit, index }));

		if (!this.collapse() || cutoff <= 0) return all();

		const cols = this.columns();
		const ranges = [
			[0, cols],
			[cutoff - 2 * cols, cutoff + 2 * cols],
		].map(([from, till]) => [Math.max(0, from), Math.min(hits.length, till)]);

		const entries: GridEntry[] = [];
		let next = 0;
		for (const [from, till] of ranges) {
			if (from > next) entries.push({ type: "gap", index: next, count: from - next });
			for (let index = Math.max(from, next); index < till; index++)
				entries.push({ type: "hit", hit: hits[index], index });
			next = Math.max(next, till);
		}
		if (next < hits.length) entries.push({ type: "gap", index: next, count: hits.length - next });
		return entries;
	});

	constructor(destroyRef: DestroyRef) {
		const observer = new ResizeObserver(() => this.measureColumns());
		destroyRef.onDestroy(() => {
			observer.disconnect();
			this.releaseTouchTargets();
		});

		effect((onCleanup) => {
			const grid = this.grid()?.nativeElement;
			observer.disconnect();
			if (!grid) return;
			observer.observe(grid);

			grid.addEventListener("wheel", this.onWheel, { passive: false });
			grid.addEventListener("touchstart", this.onTouchStart, { passive: true });
			onCleanup(() => {
				grid.removeEventListener("wheel", this.onWheel);
				grid.removeEventListener("touchstart", this.onTouchStart);
			});
		});
	}

	private scrollDelta = 0;
	private touchY: number | null = null;
	private touchTargets: EventTarget[] = [];

	private canAdjust() {
		return this.adjustable() && this.threshold() !== null && this.hits().length > 0;
	}

	private onWheel = (event: WheelEvent) => {
		if (!this.canAdjust() || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
		event.preventDefault();
		const lineHeight = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 33 : 1;
		this.scrollBy(event.deltaY * lineHeight, WHEEL_ROW_PX);
	};

	private onTouchStart = (event: TouchEvent) => {
		this.releaseTouchTargets();
		this.touchY = null;
		if (event.touches.length !== 2) return;

		this.touchY = touchMidpoint(event);
		this.scrollDelta = 0;
		this.touchTargets = [...new Set(Array.from(event.touches, (touch) => touch.target))];
		for (const target of this.touchTargets) {
			target.addEventListener("touchmove", this.onTouchMove as EventListener, { passive: false });
			target.addEventListener("touchend", this.onTouchEnd as EventListener);
			target.addEventListener("touchcancel", this.onTouchEnd as EventListener);
		}
	};

	private onTouchMove = (event: TouchEvent) => {
		if (this.touchY === null || !this.canAdjust() || event.touches.length !== 2) return;
		event.preventDefault();
		const y = touchMidpoint(event);
		this.scrollBy(this.touchY - y, TOUCH_ROW_PX);
		this.touchY = y;
	};

	private onTouchEnd = (event: TouchEvent) => {
		if (event.touches.length === 2) return;
		this.touchY = null;
		this.releaseTouchTargets();
	};

	private releaseTouchTargets() {
		for (const target of this.touchTargets) {
			target.removeEventListener("touchmove", this.onTouchMove as EventListener);
			target.removeEventListener("touchend", this.onTouchEnd as EventListener);
			target.removeEventListener("touchcancel", this.onTouchEnd as EventListener);
		}
		this.touchTargets = [];
	}

	private scrollBy(delta: number, rowPx: number) {
		const photoPx = rowPx / this.columns();
		this.scrollDelta += delta;
		const steps = Math.trunc(this.scrollDelta / photoPx);
		if (!steps) return;
		this.scrollDelta -= steps * photoPx;
		this.moveCutoff(steps);
	}

	private moveCutoff(steps: number) {
		const hits = this.hits();
		const direction = Math.sign(steps);
		let cutoff = Math.min(hits.length, Math.max(0, this.cutoffIndex() + steps));
		let threshold = this.thresholdAt(cutoff);
		while (threshold === null) {
			cutoff += direction;
			threshold = this.thresholdAt(cutoff);
		}
		if (threshold !== this.threshold()) this.thresholdChange.emit(threshold);
	}

	private thresholdAt(cutoff: number) {
		const hits = this.hits();
		if (cutoff <= 0) return (Math.floor(hits[0].score * 1000) + 1) / 1000;
		const threshold = Math.floor(hits[Math.min(cutoff, hits.length) - 1].score * 1000) / 1000;
		if (cutoff >= hits.length) return threshold;
		return threshold > hits[cutoff].score ? threshold : null;
	}

	private measureColumns() {
		const grid = this.grid()?.nativeElement;
		if (!grid) return;
		const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
		this.columns.set(Math.max(1, columns));
	}
}

function touchMidpoint(event: TouchEvent) {
	return (event.touches[0].clientY + event.touches[1].clientY) / 2;
}
