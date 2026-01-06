import { Component, Injector, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton } from "@ionic/angular/standalone";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { ActionButtonsComponent } from "src/app/shared/components/action-buttons/action-buttons.component";
import { TrimesterSelectorComponent, TrimesterDateRange } from "../../components/trimester-selector/trimester-selector.component";

@Component({
	selector: "bo-program-print",
	templateUrl: "./program-print.component.html",
	styleUrls: ["./program-print.component.scss"],
	standalone: true,
	imports: [
		FormsModule,
		IonContent,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		IonButton,
		PageHeaderComponent,
		ActionButtonsComponent,
		TrimesterSelectorComponent,
	],
})
export class ProgramPrintComponent implements OnInit {
	dateRange = signal<TrimesterDateRange | undefined>(undefined);

	actions = signal<Action[]>([]);

	constructor(
		private api: ApiService,
		private toasts: ToastService,
		private injector: Injector,
	) {}

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
	}
}
