import { Component } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForwardOutline, documentOutline, documentTextOutline, gridOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

interface ProgramExportOption {
	format: SDK.ProgramExportFormats;
	label: string;
	description: string;
	icon: string;
}

@Component({
	selector: "bo-program-export-modal",
	templateUrl: "./program-export-modal.component.html",
	styleUrl: "./program-export-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class ProgramExportModalComponent extends InputModalComponent<SDK.ProgramExportFormats> {
	readonly options: ProgramExportOption[] = [
		{
			format: "pdf",
			label: "PDF",
			description: "Program připravený k tisku a rozeslání",
			icon: "document-outline",
		},
		{
			format: "docx",
			label: "Word (DOCX)",
			description: "Stejný program jako PDF, dá se dál upravovat",
			icon: "document-text-outline",
		},
		{
			format: "xlsx",
			label: "Excel (XLSX)",
			description: "Tabulka se sloupci Název, Datum, Stav a Vedoucí",
			icon: "grid-outline",
		},
	];

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ chevronForwardOutline, documentOutline, documentTextOutline, gridOutline });
	}
}
