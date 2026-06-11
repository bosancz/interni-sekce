import { Component, input, OnInit, output } from "@angular/core";
import {
	AlertController,
	IonButton,
	IonButtons,
	IonIcon,
	IonLabel,
	IonList,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { trashOutline } from "ionicons/icons";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SDK } from "src/sdk";
import { AddButtonComponent } from "../../../../shared/components/add-button/add-button.component";
import { EditButtonComponent } from "../../../../shared/components/edit-button/edit-button.component";
import { ItemComponent } from "../../../../shared/components/item/item.component";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { CardInsuranceCardComponent } from "../card-insurance-card/card-insurance-card.component";
@UntilDestroy()
@Component({
	selector: "bo-member-health",
	templateUrl: "./member-health.component.html",
	styleUrls: ["./member-health.component.scss"],
	imports: [
		IonSkeletonText,
		IonList,
		IonLabel,
		IonButton,
		IonIcon,
		IonButtons,
		ItemComponent,
		AddButtonComponent,
		EditButtonComponent,
		MarkdownPipe,
		CardInsuranceCardComponent,
	],
})
export class MemberHealthComponent implements OnInit {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponseWithLinks>>();
	reload = output<void>();

	constructor(private alertController: AlertController) {
		addIcons({ trashOutline });
	}

	ngOnInit(): void {}

	async openKnownProblemsForm() {
		const member = this.member();
		const alert = await this.alertController.create({
			header: "Upravit známé problémy",
			inputs: [
				{
					name: "knownProblems",
					type: "textarea",
					placeholder: "Přehled známých zdravotních a jiných problémů",
					value: member?.knownProblems,
				},
			],
			buttons: [
				{
					text: "Zrušit",
					role: "cancel",
				},
				{
					text: "Uložit",
					handler: async (data) => this.update.emit({ knownProblems: data.knownProblems }),
				},
			],
		});

		await alert.present();
	}

	async openAllergiesForm() {
		const member = this.member();
		const alert = await this.alertController.create({
			header: "Přidat alergii",
			inputs: [
				{
					name: "allergy",
					type: "text",
					placeholder: "Vyplň alergii a její závažnost",
				},
			],
			buttons: [
				{
					text: "Zrušit",
					role: "cancel",
				},
				{
					text: "Uložit",
					handler: async (data) =>
						this.update.emit({ allergies: [...(member!.allergies || []), data.allergy] }),
				},
			],
		});

		await alert.present();
	}

	deleteAllergy(index: number) {
		const member = this.member();
		this.update.emit({ allergies: member!.allergies!.filter((_, i) => i !== index) });
	}
}
