import { Component, computed, Input, signal } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { getBadgeLevelTitle, UnseenBadge } from "../../helpers/badges";
import { AchievementBadgeComponent } from "../achievement-badge/achievement-badge.component";

const CONFETTI_COLORS = ["#e28f26", "#2a3478", "#799f3d", "#d2232a", "#f9cd7a", "#4a58b0"];

@Component({
	selector: "bo-badge-reveal-modal",
	templateUrl: "./badge-reveal-modal.component.html",
	styleUrl: "./badge-reveal-modal.component.scss",
	imports: [ModalLayoutComponent, AchievementBadgeComponent],
})
export class BadgeRevealModalComponent extends InputModalComponent<"list"> {
	@Input() set badges(badges: UnseenBadge[]) {
		this.items.set(badges);
	}

	readonly items = signal<UnseenBadge[]>([]);

	readonly index = signal(0);

	readonly current = computed(() => this.items()[this.index()]);

	readonly isLast = computed(() => this.index() >= this.items().length - 1);

	readonly title = computed(() => {
		const current = this.current();
		return current ? getBadgeLevelTitle(current.badge, current.level.level) : "";
	});

	readonly confetti = Array.from({ length: 28 }, (_, i) => {
		const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
		const distance = 90 + Math.random() * 70;
		return {
			x: Math.round(Math.cos(angle) * distance),
			y: Math.round(Math.sin(angle) * distance * 0.8 - 20),
			rotate: Math.round(Math.random() * 720 - 360),
			delay: Math.round(Math.random() * 120),
			color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
			round: i % 3 === 0,
		};
	});

	constructor(modalController: ModalController) {
		super(modalController);
	}

	next() {
		if (this.isLast()) this.close.emit();
		else this.index.update((index) => index + 1);
	}
}
