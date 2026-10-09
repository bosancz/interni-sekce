import { DecimalPipe } from "@angular/common";
import { Component, computed, DestroyRef, effect, ElementRef, input, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

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
		destroyRef.onDestroy(() => observer.disconnect());

		effect(() => {
			const grid = this.grid()?.nativeElement;
			observer.disconnect();
			if (grid) observer.observe(grid);
		});
	}

	private measureColumns() {
		const grid = this.grid()?.nativeElement;
		if (!grid) return;
		const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
		this.columns.set(Math.max(1, columns));
	}
}
