import { DatePipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { getMemberAchievementSlots, MemberAchievementTypes } from "src/app/core/config/member-achievements";
import {
	getMemberTrainingBadges,
	getMemberTrainingTitle,
	MemberTrainingTypes,
} from "src/app/core/config/member-trainings";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";

interface InlineBadge {
	key: string;
	icon: string;
	label: string;
	stars: number[];
}

@Component({
	selector: "bo-member-badges-inline",
	templateUrl: "./member-badges-inline.component.html",
	styleUrl: "./member-badges-inline.component.scss",
	imports: [TooltipDirective],
})
export class MemberBadgesInlineComponent {
	member = input.required<SDK.MemberResponse>();
	achievements = input(false);
	trainings = input(false);

	readonly starIcon = MemberAchievementTypes.hvezda1.icon;

	private datePipe = new DatePipe("cs");

	badges = computed<InlineBadge[]>(() => {
		const member = this.member();
		const slots = getMemberAchievementSlots(member.achievements ?? []);
		const badges: InlineBadge[] = [];

		for (const slot of slots) {
			if (this.achievements()) {
				badges.push({
					key: slot.key,
					icon: slot.icon,
					stars: slot.stars,
					label: slot.achievements.map((a) => MemberAchievementTypes[a.type].title).join(", "),
				});
			}
		}

		if (this.trainings()) {
			for (const { training } of getMemberTrainingBadges(member.trainings ?? []).badges.filter(
				(b) => !b.expired,
			)) {
				const valid = training.validUntil ? this.datePipe.transform(training.validUntil, "d. M. y") : null;
				badges.push({
					key: `training-${training.id}`,
					icon: MemberTrainingTypes[training.type].icon,
					stars: [],
					label: getMemberTrainingTitle(training) + (valid ? ` (platné do ${valid})` : ""),
				});
			}
		}

		return badges;
	});
}
