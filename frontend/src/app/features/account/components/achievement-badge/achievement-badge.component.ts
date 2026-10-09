import { Component, computed, input } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	bonfire,
	calendar,
	camera,
	compass,
	flag,
	lockClosed,
	people,
	podium,
	star,
	sunny,
	trailSign,
	trophy,
	walk,
} from "ionicons/icons";
import { BadgeTone, getBadgeTone, getLevelNumeral } from "../../helpers/badges";

let nextBadgeId = 0;

@Component({
	selector: "bo-achievement-badge",
	templateUrl: "./achievement-badge.component.html",
	styleUrl: "./achievement-badge.component.scss",
	imports: [IonIcon],
	host: {
		"[class.locked]": "locked()",
		"[style.--badge-size.px]": "size()",
	},
})
export class AchievementBadgeComponent {
	readonly icon = input.required<string>();
	readonly level = input<number>(1);
	readonly levels = input<number>(1);
	readonly locked = input<boolean>(false);
	readonly size = input<number>(72);

	readonly id = `badge-${nextBadgeId++}`;

	readonly tone = computed<BadgeTone>(() =>
		this.locked() ? "locked" : getBadgeTone(Math.max(this.level(), 1), this.levels()),
	);

	readonly numeral = computed(() =>
		this.levels() > 1 && !this.locked() ? getLevelNumeral(Math.max(this.level(), 1)) : null,
	);

	constructor() {
		addIcons({
			bonfire,
			calendar,
			camera,
			compass,
			flag,
			lockClosed,
			people,
			podium,
			star,
			sunny,
			trailSign,
			trophy,
			walk,
		});
	}
}
