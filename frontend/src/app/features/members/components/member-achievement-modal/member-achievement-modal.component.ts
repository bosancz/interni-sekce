import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkCircle, trashOutline } from "ionicons/icons";
import {
	getMemberAchievementChoices,
	isMemberAchievementStar,
	MemberAchievementChoice,
	MemberAchievementTypes,
} from "src/app/core/config/member-achievements";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export type MemberAchievementModalResult = { type: SDK.MemberAchievementTypesEnum };

@Component({
	selector: "bo-member-achievement-modal",
	templateUrl: "./member-achievement-modal.component.html",
	styleUrl: "./member-achievement-modal.component.scss",
	imports: [IonIcon, IonSpinner, ModalLayoutComponent],
})
export class MemberAchievementModalComponent
	extends InputModalComponent<MemberAchievementModalResult>
	implements OnInit
{
	member?: SDK.MemberResponseWithLinks;
	achievements: SDK.MemberAchievementResponseWithLinks[] = [];
	edited: SDK.MemberAchievementResponseWithLinks[] | null = null;
	onDelete?: (achievement: SDK.MemberAchievementResponseWithLinks) => Promise<boolean>;

	readonly types = MemberAchievementTypes;
	choices: MemberAchievementChoice[] = [];

	selected = signal<MemberAchievementChoice | null>(null);
	rows = signal<SDK.MemberAchievementResponseWithLinks[]>([]);
	deleting = signal<number | null>(null);

	isNew = computed(() => !this.edited);

	title = "";

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ trashOutline, checkmarkCircle });
	}

	ngOnInit(): void {
		if (this.edited) {
			this.rows.set(this.edited);
			this.title = this.getEditTitle(this.edited);
		} else {
			this.choices = getMemberAchievementChoices(new Set(this.achievements.map((a) => a.type)));
			this.selected.set(this.choices.find((choice) => !choice.held) ?? null);
			this.title = "Přidat ocenění";
		}
	}

	private getEditTitle(achievements: SDK.MemberAchievementResponseWithLinks[]) {
		const group = this.types[achievements[0].type].group;
		if (group === "san") return "Šán a hvězdy";
		if (group === "rank") return "Hodnosti";
		return this.types[achievements[0].type].title;
	}

	async delete(achievement: SDK.MemberAchievementResponseWithLinks) {
		if (!this.onDelete || this.deleting() !== null) return;

		this.deleting.set(achievement.id);
		try {
			if (!(await this.onDelete(achievement))) return;
			const removesStars = achievement.type === "novackovskaZkouska";
			this.rows.update((rows) =>
				rows.filter((row) => row.id !== achievement.id && !(removesStars && isMemberAchievementStar(row.type))),
			);
			if (!this.rows().length) this.close.emit();
		} finally {
			this.deleting.set(null);
		}
	}

	save() {
		const type = this.selected()?.type;
		if (type) this.submit.emit({ type });
	}
}
