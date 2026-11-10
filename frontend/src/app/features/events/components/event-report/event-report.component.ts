import { CommonModule } from "@angular/common";
import { Component, computed, effect, input, output, signal } from "@angular/core";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { checkmarkCircleOutline, lockClosedOutline, sendOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";

const REVIZOR_REPORT_TEMPLATE = "**Komplikace:**\n\n**Pochvaly:**\n\n**Stížnosti:**\n";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [
		CommonModule,
		CardComponent,
		CardContentComponent,
		CardHeaderComponent,
		CardTitleComponent,
		EditButtonMarkdownComponent,
		MarkdownPipe,
		IonButton,
		IonIcon,
		IonSkeletonText,
		TooltipDirective,
	],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	change = output<void>();

	readonly noPermissionText = "K této akci nemáš oprávnění.";

	report = signal<string | null>(null);

	canReadReport = computed(() => this.event()?._links?.getEventReport?.allowed ?? false);
	canEditReport = computed(() => this.event()?._links?.updateEventReport?.allowed ?? false);
	publishBlockedText = computed(() => {
		const event = this.event();
		if (!event?._links?.publishEventReport?.allowed) return this.noPermissionText;
		const report = this.report()?.trim();
		if (!report || report === REVIZOR_REPORT_TEMPLATE.trim()) return "Nejdřív vyplň report pro revizora.";
		return null;
	});

	canPublish = computed(() => this.publishBlockedText() === null);

	publishing = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly modalService: ModalService,
	) {
		addIcons({ lockClosedOutline, sendOutline, checkmarkCircleOutline });

		effect(() => {
			const event = this.event();
			if (event && this.canReadReport()) this.loadReport(event.id);
			else this.report.set(null);
		});
	}

	private async loadReport(eventId: number) {
		const report = await this.api.EventsApi.getEventReport(eventId)
			.then((res) => res.data.report)
			.catch(() => null);
		if (this.event()?.id === eventId) this.report.set(report);
	}

	async writeReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Report pro revizora",
			value: this.report() || REVIZOR_REPORT_TEMPLATE,
		});

		if (result !== null) await this.saveReportData({ report: result });
	}

	async publish() {
		const event = this.event();
		if (!event || !this.canPublish() || this.publishing()) return;

		this.publishing.set(true);
		try {
			await this.api.EventsApi.publishEventReport(event.id);
			this.toastService.toast("Report odeslán.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odeslat report.", { color: "warning" });
			return;
		} finally {
			this.publishing.set(false);
		}
	}

	async unpublish() {
		const event = this.event();
		if (!event || this.publishing()) return;

		const confirmed = await this.modalService.confirmationModal(
			"Report se vrátí do konceptu, dokud ho znovu neodešleš.",
			{ header: "Zrušit odeslání?", buttonText: "Zrušit odeslání" },
		);
		if (!confirmed) return;

		this.publishing.set(true);
		try {
			await this.api.EventsApi.unpublishEventReport(event.id);
			this.toastService.toast("Odeslání zrušeno.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se zrušit odeslání.", { color: "warning" });
		} finally {
			this.publishing.set(false);
		}
	}

	async saveReportData(data: SDK.EventReportUpdateBody) {
		const event = this.event();
		if (!event) return;

		try {
			await this.api.EventsApi.updateEventReport(event.id, data);
			this.toastService.toast("Uloženo.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit report.", { color: "warning" });
		}
	}
}
