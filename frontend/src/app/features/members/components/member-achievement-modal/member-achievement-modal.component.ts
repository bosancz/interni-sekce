import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, checkmarkCircle, trashOutline } from "ionicons/icons";
import {
	getMemberAchievementChoices,
	MemberAchievementChoice,
	MemberAchievementTypes,
} from "src/app/core/config/member-achievements";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export type MemberAchievementModalResult =
	| { kind: "add"; type: SDK.MemberAchievementTypesEnum }
	| { kind: "edit"; deleted: number[] };

@Component({
	selector: "bo-member-achievement-modal",
	templateUrl: "./member-achievement-modal.component.html",
	styleUrl: "./member-achievement-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class MemberAchievementModalComponent
	extends InputModalComponent<MemberAchievementModalResult>
	implements OnInit
{
	member?: SDK.MemberResponseWithLinks;
	achievements: SDK.MemberAchievementResponseWithLinks[] = [];
	edited: SDK.MemberAchievementResponseWithLinks[] | null = null;

	readonly types = MemberAchievementTypes;
	choices: MemberAchievementChoice[] = [];

	selected = signal<MemberAchievementChoice | null>(null);
	deleted = signal<number[]>([]);

	isNew = computed(() => !this.edited);

	canSave = computed(() => (this.isNew() ? !!this.selected()?.type : this.deleted().length > 0));

	title = "";

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ trashOutline, arrowUndoOutline, checkmarkCircle });
	}

	ngOnInit(): void {
		if (this.edited) {
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

	toggleDeleted(achievementId: number) {
		this.deleted.update((ids) =>
			ids.includes(achievementId) ? ids.filter((id) => id !== achievementId) : [...ids, achievementId],
		);
	}

	save() {
		if (!this.canSave()) return;

		if (!this.edited) this.submit.emit({ kind: "add", type: this.selected()!.type! });
		else this.submit.emit({ kind: "edit", deleted: this.deleted() });
	}
}
