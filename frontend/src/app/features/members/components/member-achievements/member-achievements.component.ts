import { Component, computed, effect, input, signal } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, ribbonOutline } from "ionicons/icons";
import {
	MemberAchievementTypes,
	getMemberAchievementSlots,
	isMemberAchievementStar,
} from "src/app/core/config/member-achievements";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MemberRanksModalComponent } from "../member-ranks-modal/member-ranks-modal.component";
import { MemberAchievementsModalResult, MemberSanModalComponent } from "../member-san-modal/member-san-modal.component";

type AchievementBox = {
	key: "san" | "rank";
	icon: string;
	stars: number[];
	empty: boolean;
	label: string;
};

@Component({
	selector: "bo-member-achievements",
	templateUrl: "./member-achievements.component.html",
	styleUrl: "./member-achievements.component.scss",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		TooltipDirective,
	],
})
export class MemberAchievementsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	achievements = signal<SDK.MemberAchievementResponseWithLinks[] | undefined>(undefined);

	canEdit = computed(() => !!this.member()?._links?.createMemberAchievement?.allowed);

	boxes = computed<AchievementBox[]>(() => {
		const slots = getMemberAchievementSlots(this.achievements() ?? []);
		const san = slots.find((slot) => slot.key === "san");
		const rank = slots.find((slot) => slot.key === "rank");
		return [
			{
				key: "san",
				icon: san?.icon ?? MemberAchievementTypes.novackovskaZkouska.icon,
				stars: san?.stars ?? [],
				empty: !san,
				label: san ? this.getLabel(san.achievements) : "Šán a hvězdy",
			},
			{
				key: "rank",
				icon: rank?.icon ?? MemberAchievementTypes.clunar.icon,
				stars: [],
				empty: !rank,
				label: rank ? this.getLabel(rank.achievements) : "Hodnost",
			},
		];
	});

	readonly starIcon = MemberAchievementTypes.hvezda1.icon;
	readonly noPermissionText = "K této akci nemáš oprávnění.";

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ ribbonOutline, addOutline });
		effect(() => {
			const memberId = this.member()?.id;
			this.load(memberId ?? null);
		});
	}

	async load(memberId: number | null) {
		if (!memberId) {
			this.achievements.set(undefined);
			return;
		}
		const res = await this.api.MembersApi.listMemberAchievements(memberId);
		this.achievements.set(res.data);
	}

	private getLabel(achievements: SDK.MemberAchievementResponse[]) {
		return achievements.map((a) => MemberAchievementTypes[a.type].title).join(", ");
	}

	getTooltip(box: AchievementBox) {
		if (!this.canEdit()) return box.empty ? null : box.label;
		return box.empty ? (box.key === "san" ? "Přidat šán a hvězdy" : "Přidat hodnost") : box.label;
	}

	async open(box: AchievementBox) {
		const member = this.member();
		const achievements = this.achievements();
		if (!member || !achievements || !this.canEdit()) return;

		const group = box.key;
		const current = achievements.filter((a) => MemberAchievementTypes[a.type].group === group);
		const held = current.map((a) => a.type);
		const result: MemberAchievementsModalResult | null =
			group === "san"
				? await this.modalService.componentModal(
						MemberSanModalComponent,
						{ held },
						{ cssClass: "dialog-brand" },
					)
				: await this.modalService.componentModal(
						MemberRanksModalComponent,
						{ held },
						{ cssClass: "dialog-brand" },
					);
		if (!result) return;

		const wanted = new Set(result.types);
		const added = result.types.filter((type) => !current.some((a) => a.type === type));
		const removed = current
			.filter((a) => !wanted.has(a.type))
			.sort((a, b) => Number(isMemberAchievementStar(b.type)) - Number(isMemberAchievementStar(a.type)));

		try {
			for (const type of added) await this.api.MembersApi.createMemberAchievement(member.id, { type });
			for (const achievement of removed) {
				await this.api.MembersApi.deleteMemberAchievement(member.id, achievement.id).catch((err) => {
					if (err?.response?.status !== 404) throw err;
				});
			}
			if (added.length || removed.length) await this.toastService.toast("Ocenění byla uložena");
		} finally {
			await this.load(member.id);
		}
	}
}
