import { Component, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
import { MEMBER_ACHIEVEMENT_RANKS, MemberAchievementTypes } from "src/app/core/config/member-achievements";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { MemberAchievementsModalResult } from "../member-san-modal/member-san-modal.component";

@Component({
	selector: "bo-member-ranks-modal",
	templateUrl: "./member-ranks-modal.component.html",
	styleUrl: "./member-ranks-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class MemberRanksModalComponent extends InputModalComponent<MemberAchievementsModalResult> implements OnInit {
	held: SDK.MemberAchievementTypesEnum[] = [];

	readonly types = MemberAchievementTypes;
	readonly ranks = MEMBER_ACHIEVEMENT_RANKS;

	selected = signal(new Set<SDK.MemberAchievementTypesEnum>());

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit(): void {
		this.selected.set(new Set(this.held.filter((type) => this.ranks.includes(type))));
	}

	toggle(type: SDK.MemberAchievementTypesEnum) {
		const selected = new Set(this.selected());
		if (selected.has(type)) selected.delete(type);
		else selected.add(type);
		this.selected.set(selected);
	}

	save() {
		this.submit.emit({ types: this.ranks.filter((type) => this.selected().has(type)) });
	}
}
