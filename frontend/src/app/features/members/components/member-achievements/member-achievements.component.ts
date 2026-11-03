import { Component, computed, effect, input, signal } from "@angular/core";
import { IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { ribbonOutline } from "ionicons/icons";
import {
	MEMBER_ACHIEVEMENT_TYPES,
	MemberAchievementSlot,
	MemberAchievementTypes,
	getMemberAchievementSlots,
} from "src/app/core/config/member-achievements";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MemberAchievementModalComponent } from "../member-achievement-modal/member-achievement-modal.component";

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
		IonButtons,
		IonSkeletonText,
		AddButtonComponent,
		TooltipDirective,
	],
})
export class MemberAchievementsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	achievements = signal<SDK.MemberAchievementResponseWithLinks[] | undefined>(undefined);

	slots = computed(() => getMemberAchievementSlots(this.achievements() ?? []));

	canAdd = computed(
		() =>
			!!this.member()?._links?.createMemberAchievement?.allowed &&
			this.achievements() !== undefined &&
			this.achievements()!.length < MEMBER_ACHIEVEMENT_TYPES.length,
	);

	readonly types = MemberAchievementTypes;
	readonly starIcon = MemberAchievementTypes.hvezda1.icon;
	readonly noPermissionText = "K této akci nemáš oprávnění.";

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ ribbonOutline });
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

	getSlotLabel(slot: MemberAchievementSlot) {
		return slot.achievements.map((a) => this.types[a.type].title).join(", ");
	}

	canEdit(slot: MemberAchievementSlot) {
		return slot.achievements.some((a) => a._links.deleteMemberAchievement.allowed);
	}

	async openAdd() {
		if (!this.canAdd()) return;
		await this.openModal(null);
	}

	async openEdit(slot: MemberAchievementSlot) {
		if (!this.canEdit(slot)) return;
		await this.openModal(slot.achievements);
	}

	private async openModal(edited: SDK.MemberAchievementResponseWithLinks[] | null) {
		const member = this.member();
		if (!member) return;

		const result = await this.modalService.componentModal(
			MemberAchievementModalComponent,
			{ member, achievements: this.achievements() ?? [], edited },
			{ cssClass: "dialog-brand" },
		);
		if (!result) return;

		if (result.kind === "add") {
			await this.api.MembersApi.createMemberAchievement(member.id, { type: result.type });
			await this.toastService.toast(`Ocenění ${this.types[result.type].title} bylo přidáno`);
		} else {
			for (const id of result.deleted) await this.api.MembersApi.deleteMemberAchievement(member.id, id);
			await this.toastService.toast(
				result.deleted.length > 1 ? "Ocenění byla odebrána" : "Ocenění bylo odebráno",
			);
		}

		await this.load(member.id);
	}
}
