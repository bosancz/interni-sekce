import { Component, Injector, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonButton, IonButtons, ModalController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import {
	TrimesterDateRange,
	TrimesterSelectorComponent,
} from "../../components/trimester-selector/trimester-selector.component";

@Component({
	selector: "bo-program-print-modal",
	templateUrl: "./program-print-modal.component.html",
	styleUrls: ["./program-print-modal.component.scss"],

	imports: [FormsModule, IonButtons, IonButton, ModalLayoutComponent, TrimesterSelectorComponent],
})
export class ProgramPrintModalComponent extends InputModalComponent implements OnInit {
	dateRange = signal<TrimesterDateRange | undefined>(undefined);

	constructor(
		modalController: ModalController,
		private api: ApiService,
		private toasts: ToastService,
		private injector: Injector,
	) {
		super(modalController);
	}

	ngOnInit(): void {}

	async exportProgram() {
		const dateRange = this.dateRange();
		if (!dateRange) {
			this.toasts.toast("Nelze vygenerovat program, neplatné rozmezí.");
			return;
		}

		const requestOptions = {
			filter: {
				dateFrom: { $lte: dateRange[1] },
				dateTill: { $gte: dateRange[0] },
				status: "public",
			},
			select: "_id name description dateFrom dateTill leaders",
		};

		//TODO: use options above
		const events = await this.api.EventsApi.listEvents().then((res) => res.data);

		if (!events.length) {
			this.toasts.toast("Nelze vygenerovat program, ve vybraném rozmezí nejsou žádné akce.");
			return;
		}

		// lazy načítání ProgramExportService, je totiž závislá na obrovské (700k) docx knihovně
		const ProgramExportService = await import("../../services/program-export.service").then(
			(f) => f.ProgramExportService,
		);
		const programExport = this.injector.get(ProgramExportService);

		programExport.export(events);

		// Close modal after successful export
		this.close.emit();
	}
}
