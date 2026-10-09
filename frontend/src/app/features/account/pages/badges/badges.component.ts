import { DatePipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { IonSpinner } from "@ionic/angular/standalone";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { AchievementBadgeComponent } from "../../components/achievement-badge/achievement-badge.component";
import { getBadgeLevelTitle, getLevelNumeral, getNextLevel } from "../../helpers/badges";
import { AccountBadgesService } from "../../services/account-badges.service";

@Component({
	selector: "bo-badges",
	templateUrl: "./badges.component.html",
	styleUrl: "./badges.component.scss",
	imports: [DatePipe, IonSpinner, PageHeaderComponent, PageContentComponent, AchievementBadgeComponent],
})
export class BadgesComponent {
	readonly badges = signal<SDK.BadgeResponse[] | undefined>(undefined);

	readonly rows = computed(() =>
		this.badges()?.map((badge) => {
			const next = getNextLevel(badge);
			const previous = badge.levels[badge.level - 1]?.threshold ?? 0;
			const earnedAt = badge.levels[badge.level - 1]?.earnedAt ?? null;

			return {
				badge,
				title: getBadgeLevelTitle(badge, Math.max(badge.level, 1)),
				earnedAt,
				next,
				progress: next ? Math.min(1, Math.max(0, (badge.value - previous) / (next.threshold - previous))) : 1,
				levels: badge.levels.map((level) => ({ ...level, numeral: getLevelNumeral(level.level) })),
			};
		}),
	);

	readonly earnedCount = computed(() => this.badges()?.filter((badge) => badge.level > 0).length ?? 0);

	constructor(private accountBadgesService: AccountBadgesService) {}

	async ionViewWillEnter() {
		const badges = await this.accountBadgesService.load();
		this.badges.set(badges);

		if (await this.accountBadgesService.revealNew(badges)) this.badges.set(await this.accountBadgesService.load());
	}
}
