import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
import { MEMBER_ACHIEVEMENT_STARS, MemberAchievementTypes } from "src/app/core/config/member-achievements";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export type MemberAchievementsModalResult = { types: SDK.MemberAchievementTypesEnum[] };

@Component({
	selector: "bo-member-san-modal",
	templateUrl: "./member-san-modal.component.html",
	styleUrl: "./member-san-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class MemberSanModalComponent extends InputModalComponent<MemberAchievementsModalResult> implements OnInit {
	held: SDK.MemberAchievementTypesEnum[] = [];

	readonly types = MemberAchievementTypes;
	readonly starPositions = [1, 2, 3, 4];

	novackovskaZkouska = signal(false);
	cernySan = signal(false);
	stars = signal(0);
	hovered = signal<number | null>(null);

	shownStars = computed(() => (this.novackovskaZkouska() ? (this.hovered() ?? this.stars()) : 0));

	icon = computed(() => {
		if (this.cernySan()) return this.types.cernySan.icon;
		return this.types.novackovskaZkouska.icon;
	});

	hasSan = computed(() => this.novackovskaZkouska() || this.cernySan());

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit(): void {
		const held = new Set(this.held);
		const stars = MEMBER_ACHIEVEMENT_STARS.filter((type) => held.has(type)).length;
		this.novackovskaZkouska.set(held.has("novackovskaZkouska") || stars > 0);
		this.cernySan.set(held.has("cernySan"));
		this.stars.set(stars);
	}

	toggleNovackovskaZkouska() {
		const value = !this.novackovskaZkouska();
		this.novackovskaZkouska.set(value);
		if (!value) this.stars.set(0);
	}

	toggleStar(star: number) {
		if (!this.novackovskaZkouska()) return;
		this.stars.set(this.stars() >= star ? star - 1 : star);
	}

	getStarsLabel() {
		const count = this.stars();
		if (count === 0) return "Žádná hvězda";
		if (count === 1) return "1 hvězda";
		return `${count} hvězdy`;
	}

	save() {
		const types: SDK.MemberAchievementTypesEnum[] = [];
		if (this.novackovskaZkouska())
			types.push("novackovskaZkouska", ...MEMBER_ACHIEVEMENT_STARS.slice(0, this.stars()));
		if (this.cernySan()) types.push("cernySan");
		this.submit.emit({ types });
	}
}
