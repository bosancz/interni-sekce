import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, checkmarkCircle, trashOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import {
	getMemberAchievementChoices,
	MemberAchievementChoice,
	MemberAchievementTypes,
} from "src/app/core/config/member-achievements";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export type MemberAchievementModalResult =
	| { kind: "add"; type: SDK.MemberAchievementTypesEnum; date: string }
	| { kind: "edit"; dates: Record<number, string>; deleted: number[] };

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
	date = signal(DateTime.now().toISODate());

	dates = signal<Record<number, string>>({});
	deleted = signal<number[]>([]);

	isNew = computed(() => !this.edited);

	heldTypes = new Set<SDK.MemberAchievementTypesEnum>();

	title = "";

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ trashOutline, arrowUndoOutline, checkmarkCircle });
	}

	ngOnInit(): void {
		this.heldTypes = new Set(this.achievements.map((a) => a.type));
		if (this.edited) {
			this.dates.set(Object.fromEntries(this.edited.map((a) => [a.id, a.date])));
			this.title = this.getEditTitle(this.edited);
		} else {
			this.choices = getMemberAchievementChoices(this.heldTypes);
			this.selected.set(this.choices.find((choice) => !choice.held) ?? null);
			this.title = "Přidat nášivku";
		}
	}

	private getEditTitle(achievements: SDK.MemberAchievementResponseWithLinks[]) {
		const group = this.types[achievements[0].type].group;
		if (group === "san") return "Šán a hvězdy";
		if (group === "rank") return "Hodnosti";
		return this.types[achievements[0].type].title;
	}

	setDate(achievementId: number, value: string) {
		this.dates.update((dates) => ({ ...dates, [achievementId]: value }));
	}

	toggleDeleted(achievementId: number) {
		this.deleted.update((ids) =>
			ids.includes(achievementId) ? ids.filter((id) => id !== achievementId) : [...ids, achievementId],
		);
	}

	canSave = computed(() => {
		if (this.isNew()) return !!this.selected()?.type && !!this.date();
		return Object.entries(this.dates()).every(([id, date]) => this.deleted().includes(Number(id)) || !!date);
	});

	save() {
		if (!this.canSave()) return;

		if (!this.edited) {
			this.submit.emit({ kind: "add", type: this.selected()!.type!, date: this.date() });
			return;
		}

		const deleted = this.deleted();
		const dates: Record<number, string> = {};
		for (const achievement of this.edited) {
			const date = this.dates()[achievement.id];
			if (!deleted.includes(achievement.id) && date !== achievement.date) dates[achievement.id] = date;
		}
		this.submit.emit({ kind: "edit", dates, deleted });
	}
}
