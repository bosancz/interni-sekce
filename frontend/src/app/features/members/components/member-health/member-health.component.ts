import { Component, input, output } from "@angular/core";
import { IonButton, IonButtons, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	alertCircle,
	alertCircleOutline,
	ellipse,
	helpCircle,
	medkitOutline,
	trashOutline,
	warning,
} from "ionicons/icons";
import { HealthSeverities } from "src/app/core/config/health-severity";
import { ModalService } from "src/app/core/services/modal.service";
import { HealthEntryModalComponent } from "../health-entry-modal/health-entry-modal.component";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { AddButtonComponent } from "../../../../shared/components/add-button/add-button.component";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { CardInsuranceCardComponent } from "../card-insurance-card/card-insurance-card.component";

@UntilDestroy()
@Component({
	selector: "bo-member-health",
	templateUrl: "./member-health.component.html",
	styleUrls: ["./member-health.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonSkeletonText,
		IonList,
		IonItem,
		IonLabel,
		IonButton,
		IonButtons,
		IonIcon,
		AddButtonComponent,
		CardInsuranceCardComponent,
	],
})
export class MemberHealthComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponseWithLinks>>();
	reload = output<void>();

	readonly severities = HealthSeverities;

	constructor(
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ trashOutline, ellipse, alertCircle, alertCircleOutline, medkitOutline, warning, helpCircle });
	}

	async openAllergyForm(index?: number) {
		const allergies = await this.openEntryAlert(this.member()?.allergies, index, {
			addHeader: "Přidat alergii",
			editHeader: "Upravit alergii",
			namePlaceholder: "Syrová mrkev",
		});
		if (allergies) this.update.emit({ allergies });
	}

	async openProblemForm(index?: number) {
		const knownProblems = await this.openEntryAlert(this.member()?.knownProblems, index, {
			addHeader: "Přidat problém",
			editHeader: "Upravit problém",
			namePlaceholder: "Např. astma, epilepsie, cukrovka…",
		});
		if (knownProblems) this.update.emit({ knownProblems });
	}

	async deleteAllergy(index: number) {
		const entry = this.member()?.allergies?.[index];
		if (!entry) return;
		if (!(await this.modalService.deleteConfirmationModal(`Opravdu smazat alergii „${entry.name}“?`))) return;
		this.update.emit({ allergies: this.member()!.allergies!.filter((_, i) => i !== index) });
	}

	async deleteProblem(index: number) {
		const entry = this.member()?.knownProblems?.[index];
		if (!entry) return;
		if (!(await this.modalService.deleteConfirmationModal(`Opravdu smazat problém „${entry.name}“?`))) return;
		this.update.emit({ knownProblems: this.member()!.knownProblems!.filter((_, i) => i !== index) });
	}

	private async openEntryAlert(
		current: SDK.HealthEntryDto[] | null | undefined,
		index: number | undefined,
		labels: { addHeader: string; editHeader: string; namePlaceholder: string },
	): Promise<SDK.HealthEntryDto[] | null> {
		const editing = index !== undefined;
		const entry = editing ? current?.[index] : undefined;

		const updated = await this.modalService.componentModal(
			HealthEntryModalComponent,
			{ header: editing ? labels.editHeader : labels.addHeader, placeholder: labels.namePlaceholder, entry },
			{ cssClass: "dialog-brand" },
		);
		if (!updated) return null;

		const entries = [...(current ?? [])];
		if (editing) entries[index] = updated;
		else entries.push(updated);

		return entries;
	}
}
