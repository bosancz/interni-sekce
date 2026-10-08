import { DecimalPipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

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

	cutoffIndex = computed(() => {
		const threshold = this.threshold();
		if (threshold === null) return -1;
		const index = this.hits().findIndex((hit) => hit.score < threshold);
		return index === -1 ? this.hits().length : index;
	});
}
