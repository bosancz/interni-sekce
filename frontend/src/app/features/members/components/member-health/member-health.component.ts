import { Component, input, output } from "@angular/core";
import {
	AlertController,
	IonButton,
	IonButtons,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { alertCircle, ellipse, helpCircle, trashOutline, warning } from "ionicons/icons";
import { DefaultHealthSeverity, HealthSeverities, HealthSeverityOrder } from "src/app/core/config/health-severity";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { AddButtonComponent } from "../../../../shared/components/add-button/add-button.component";
import { CardInsuranceCardComponent } from "../card-insurance-card/card-insurance-card.component";

@UntilDestroy()
@Component({
	selector: "bo-member-health",
	templateUrl: "./member-health.component.html",
	styleUrls: ["./member-health.component.scss"],
	imports: [
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
	readonly severityOrder = HealthSeverityOrder;

	constructor(
		private alertController: AlertController,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ trashOutline, ellipse, alertCircle, warning, helpCircle });
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

	/**
	 * Two-step Ionic alert flow: first a text box for the name, then a selectable
	 * list of the three severity levels saved with a normal button. Resolves with the
	 * updated list, or null when cancelled. When `index` is given the entry at that
	 * position is edited, otherwise a new one is appended.
	 *
	 * It is split into two alerts because a single Ionic alert can only render one
	 * input kind — it cannot mix a text field with a radio selection.
	 */
	private async openEntryAlert(
		current: SDK.HealthEntry[] | null | undefined,
		index: number | undefined,
		labels: { addHeader: string; editHeader: string; namePlaceholder: string },
	): Promise<SDK.HealthEntry[] | null> {
		const editing = index !== undefined;
		const entry = editing ? current?.[index] : undefined;

		const name = await this.askName(
			editing ? labels.editHeader : labels.addHeader,
			labels.namePlaceholder,
			entry?.name,
		);
		if (!name) return null;

		const severity = await this.askSeverity(entry?.severity);
		if (!severity) return null;

		const entries = [...(current ?? [])];
		const updated: SDK.HealthEntry = { name, severity };
		if (editing) entries[index] = updated;
		else entries.push(updated);

		return entries;
	}

	/** Step 1 – text box for the entry name. */
	private askName(header: string, placeholder: string, value?: string): Promise<string | null> {
		return new Promise(async (resolve) => {
			const alert = await this.alertController.create({
				header,
				inputs: [
					{
						name: "name",
						type: "text",
						placeholder,
						value,
						attributes: { autocapitalize: "sentences" },
					},
				],
				buttons: [
					{ text: "Zrušit", role: "cancel", handler: () => resolve(null) },
					{
						text: "Další",
						handler: (data: { name?: string }) => {
							const name = data.name?.trim();
							if (!name) {
								this.toastService.toast("Vyplň název", { color: "danger" });
								return false; // keep the alert open
							}
							resolve(name);
						},
					},
				],
			});

			await alert.present();
		});
	}

	/** Step 2 – pick one of the three severity levels, then save. */
	private askSeverity(currentSeverity?: SDK.HealthSeverityEnum): Promise<SDK.HealthSeverityEnum | null> {
		const selected = currentSeverity ?? DefaultHealthSeverity;

		return new Promise(async (resolve) => {
			const alert = await this.alertController.create({
				header: "Závažnost",
				inputs: this.severityOrder.map((severity) => ({
					type: "radio",
					label: `${this.severities[severity].emoji} ${this.severities[severity].title}`,
					value: severity,
					checked: severity === selected,
				})),
				buttons: [
					{ text: "Zrušit", role: "cancel", handler: () => resolve(null) },
					{
						text: "Uložit",
						handler: (severity: SDK.HealthSeverityEnum) => resolve(severity ?? selected),
					},
				],
			});

			await alert.present();
		});
	}
}
