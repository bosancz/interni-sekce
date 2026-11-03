import { Component, computed, signal } from "@angular/core";
import { IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkCircle, closeOutline, peopleOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MEMBER_TRAINING_TYPES, MemberTrainingTypes } from "src/app/core/config/member-trainings";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-trainings-bulk",
	templateUrl: "./trainings-bulk.component.html",
	styleUrl: "./trainings-bulk.component.scss",
	imports: [IonIcon, IonSpinner, PageHeaderComponent, PageContentComponent, GroupPipe],
})
export class TrainingsBulkComponent {
	readonly types = MemberTrainingTypes;
	readonly typeList = MEMBER_TRAINING_TYPES;

	type = signal<SDK.MemberTrainingTypesEnum>("zdravotnik");
	name = signal("");
	issuedOn = signal(DateTime.now().toISODate());
	validUntil = signal("");
	issuer = signal("");

	members = signal<SDK.MemberResponse[]>([]);
	memberIds = computed(() => this.members().map((member) => member.id));

	saving = signal(false);
	error = signal<string | null>(null);

	canCreate = computed(() => !!this.api.links()?.createMembersTrainings?.allowed);

	submitLabel = computed(() => {
		const count = this.members().length;
		if (count === 0) return "Přidat školení";
		if (count === 1) return "Přidat školení 1 člověku";
		return `Přidat školení ${count} lidem`;
	});

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ checkmarkCircle, closeOutline, peopleOutline });
	}

	setType(type: SDK.MemberTrainingTypesEnum) {
		this.type.set(type);
		this.error.set(null);
	}

	async selectMembers() {
		await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				keepOpenAfterSelect: true,
				title: "Komu přidat školení",
				subtitle: "Vyber lidi, kteří školení absolvovali.",
				selectedIds: this.memberIds,
				onSelect: (member: SDK.MemberResponse) => {
					this.members.update((members) => [...members, member]);
					this.error.set(null);
				},
				onDeselect: (member: SDK.MemberResponse) => this.removeMember(member),
				onClearAll: () => this.members.set([]),
			},
			{ cssClass: "dialog-picker" },
		);
	}

	removeMember(member: SDK.MemberResponse) {
		this.members.update((members) => members.filter((item) => item.id !== member.id));
	}

	async save() {
		const name = this.name().trim();
		if (this.type() === "custom" && !name) {
			this.error.set("Vyplň název školení.");
			return;
		}
		if (this.issuedOn() && this.validUntil() && this.validUntil() < this.issuedOn()) {
			this.error.set("Platnost nemůže skončit dřív, než bylo školení uděleno.");
			return;
		}
		if (!this.members().length) {
			this.error.set("Vyber aspoň jednoho člověka.");
			return;
		}

		this.saving.set(true);
		try {
			const trainings = await this.api.MembersApi.createMembersTrainings({
				memberIds: this.memberIds(),
				type: this.type(),
				name: this.type() === "custom" ? name : null,
				issuedOn: this.issuedOn() || null,
				validUntil: this.validUntil() || null,
				issuer: this.issuer().trim() || null,
			}).then((res) => res.data);

			const count = trainings.length;
			this.toastService.toast(count === 1 ? "Školení přidáno 1 člověku." : `Školení přidáno ${count} lidem.`);
			this.members.set([]);
		} catch (e) {
			this.toastService.toast("Nepodařilo se přidat školení.", { color: "danger" });
		} finally {
			this.saving.set(false);
		}
	}
}
