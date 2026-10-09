import { Component, computed, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForwardOutline, ribbonOutline } from "ionicons/icons";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { SDK } from "src/sdk";
import { getBadgeLevelTitle, getNextLevel } from "../../helpers/badges";
import { AccountBadgesService } from "../../services/account-badges.service";
import { AchievementBadgeComponent } from "../achievement-badge/achievement-badge.component";

const PREVIEW_LOCKED = 4;

@Component({
	selector: "bo-account-badges",
	templateUrl: "./account-badges.component.html",
	styleUrl: "./account-badges.component.scss",
	imports: [
		RouterLink,
		IonButton,
		IonIcon,
		IonSpinner,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		AchievementBadgeComponent,
	],
})
export class AccountBadgesComponent implements OnInit {
	readonly badges = signal<SDK.BadgeResponse[] | undefined>(undefined);

	readonly earned = computed(() =>
		(this.badges() ?? [])
			.filter((badge) => badge.level > 0)
			.map((badge) => ({
				badge,
				title: getBadgeLevelTitle(badge, badge.level),
				earnedAt: badge.levels[badge.level - 1]?.earnedAt ?? "",
			}))
			.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)),
	);

	readonly locked = computed(() =>
		(this.badges() ?? []).filter((badge) => badge.level === 0).slice(0, PREVIEW_LOCKED),
	);

	readonly totalLevels = computed(() => (this.badges() ?? []).reduce((sum, badge) => sum + badge.levels.length, 0));

	readonly earnedLevels = computed(() => (this.badges() ?? []).reduce((sum, badge) => sum + badge.level, 0));

	readonly nextUp = computed(() => {
		const candidates = (this.badges() ?? []).flatMap((badge) => {
			const next = getNextLevel(badge);
			const previous = badge.levels[badge.level - 1]?.threshold ?? 0;
			if (!next || badge.value <= previous) return [];
			return [
				{
					badge,
					next,
					title: getBadgeLevelTitle(badge, next.level),
					progress: (badge.value - previous) / (next.threshold - previous),
				},
			];
		});
		return candidates.sort((a, b) => b.progress - a.progress)[0];
	});

	constructor(private accountBadgesService: AccountBadgesService) {
		addIcons({ ribbonOutline, chevronForwardOutline });
	}

	async ngOnInit() {
		const badges = await this.accountBadgesService.load();
		this.badges.set(badges);

		if (await this.accountBadgesService.revealNew(badges)) this.badges.set(await this.accountBadgesService.load());
	}
}
