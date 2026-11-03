import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkCircle, trashOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import {
	getMemberTrainingTitle,
	MEMBER_TRAINING_TYPES,
	MemberTrainingTypes,
} from "src/app/core/config/member-trainings";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export interface MemberTrainingFormData {
	type: SDK.MemberTrainingTypesEnum;
	name: string | null;
	issuedOn: string | null;
	validUntil: string | null;
	issuer: string | null;
}

export type MemberTrainingModalResult = { kind: "save"; data: MemberTrainingFormData } | { kind: "delete" };

@Component({
	selector: "bo-member-training-modal",
	templateUrl: "./member-training-modal.component.html",
	styleUrl: "./member-training-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class MemberTrainingModalComponent extends InputModalComponent<MemberTrainingModalResult> implements OnInit {
	training: SDK.MemberTrainingResponseWithLinks | null = null;

	readonly types = MemberTrainingTypes;
	readonly typeList = MEMBER_TRAINING_TYPES;

	type = signal<SDK.MemberTrainingTypesEnum>("zdravotnik");
	name = signal("");
	issuedOn = signal("");
	validUntil = signal("");
	issuer = signal("");

	isNew = computed(() => !this.training);
	canEdit = computed(() => !this.training || this.training._links.updateMemberTraining.allowed);
	canDelete = computed(() => !!this.training?._links.deleteMemberTraining.allowed);

	error = signal<string | null>(null);

	title = "";

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkCircle, trashOutline });
	}

	ngOnInit(): void {
		if (this.training) {
			this.type.set(this.training.type);
			this.name.set(this.training.name ?? "");
			this.issuedOn.set(this.training.issuedOn ?? "");
			this.validUntil.set(this.training.validUntil ?? "");
			this.issuer.set(this.training.issuer ?? "");
			this.title = getMemberTrainingTitle(this.training);
		} else {
			this.issuedOn.set(DateTime.now().toISODate());
			this.title = "Přidat školení";
		}
	}

	save() {
		const name = this.name().trim();
		if (this.type() === "custom" && !name) {
			this.error.set("Vyplň název školení.");
			return;
		}
		if (this.issuedOn() && this.validUntil() && this.validUntil() < this.issuedOn()) {
			this.error.set("Platnost nemůže skončit dřív, než bylo školení uděleno.");
			return;
		}

		this.submit.emit({
			kind: "save",
			data: {
				type: this.type(),
				name: this.type() === "custom" ? name : null,
				issuedOn: this.issuedOn() || null,
				validUntil: this.validUntil() || null,
				issuer: this.issuer().trim() || null,
			},
		});
	}

	remove() {
		this.submit.emit({ kind: "delete" });
	}
}
