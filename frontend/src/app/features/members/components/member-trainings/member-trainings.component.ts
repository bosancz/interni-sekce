import { DatePipe } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { schoolOutline } from "ionicons/icons";
import {
	getMemberTrainingBadges,
	getMemberTrainingTitle,
	MemberTrainingBadge,
	MemberTrainingTypes,
} from "src/app/core/config/member-trainings";
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
import { MemberTrainingModalComponent } from "../member-training-modal/member-training-modal.component";

@Component({
	selector: "bo-member-trainings",
	templateUrl: "./member-trainings.component.html",
	styleUrl: "./member-trainings.component.scss",
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
		DatePipe,
	],
})
export class MemberTrainingsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	trainings = signal<SDK.MemberTrainingResponseWithLinks[] | undefined>(undefined);
	showAll = signal(false);

	private grouped = computed(() => getMemberTrainingBadges(this.trainings() ?? []));
	visibleBadges = computed(() =>
		this.showAll() ? [...this.grouped().badges, ...this.grouped().hidden] : this.grouped().badges,
	);
	hiddenCount = computed(() => this.grouped().hidden.length);

	readonly types = MemberTrainingTypes;
	readonly noPermissionText = "K této akci nemáš oprávnění.";

	private datePipe = new DatePipe("cs");

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ schoolOutline });
		effect(() => {
			const memberId = this.member()?.id;
			this.load(memberId ?? null);
		});
	}

	async load(memberId: number | null) {
		if (!memberId) {
			this.trainings.set(undefined);
			return;
		}
		const res = await this.api.MembersApi.listMemberTrainings(memberId);
		this.trainings.set(res.data);
	}

	getLabel(badge: MemberTrainingBadge) {
		const { training } = badge;
		const parts = [getMemberTrainingTitle(training)];
		const issued = training.issuedOn ? this.datePipe.transform(training.issuedOn, "d. M. y") : null;
		const valid = training.validUntil ? this.datePipe.transform(training.validUntil, "d. M. y") : null;
		if (issued) parts.push(`uděleno ${issued}`);
		if (valid) parts.push(badge.expired ? `neplatné od ${valid}` : `platné do ${valid}`);
		if (training.issuer) parts.push(`vydal ${training.issuer}`);
		return parts.join(" · ");
	}

	canEdit(training: SDK.MemberTrainingResponseWithLinks) {
		return training._links.updateMemberTraining.allowed || training._links.deleteMemberTraining.allowed;
	}

	async openAdd() {
		if (!this.member()?._links?.createMemberTraining?.allowed) return;
		await this.openModal(null);
	}

	async openEdit(training: SDK.MemberTrainingResponseWithLinks) {
		if (!this.canEdit(training)) return;
		await this.openModal(training);
	}

	private async openModal(training: SDK.MemberTrainingResponseWithLinks | null) {
		const member = this.member();
		if (!member) return;

		const result = await this.modalService.componentModal(
			MemberTrainingModalComponent,
			{ training },
			{ cssClass: "dialog-brand" },
		);
		if (!result) return;

		if (result.kind === "delete" && training) {
			const confirmed = await this.modalService.deleteConfirmationModal(
				`Opravdu smazat školení ${getMemberTrainingTitle(training)}?`,
			);
			if (!confirmed) return;
			await this.api.MembersApi.deleteMemberTraining(member.id, training.id);
			await this.toastService.toast("Školení bylo smazáno", { color: "danger" });
		} else if (result.kind === "save" && training) {
			const { type, ...data } = result.data;
			await this.api.MembersApi.updateMemberTraining(member.id, training.id, data);
			await this.toastService.toast("Školení bylo upraveno");
		} else if (result.kind === "save") {
			await this.api.MembersApi.createMemberTraining(member.id, result.data);
			await this.toastService.toast("Školení bylo přidáno");
		}

		await this.load(member.id);
	}
}
