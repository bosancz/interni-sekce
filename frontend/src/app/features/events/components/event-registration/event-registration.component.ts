import { CommonModule } from "@angular/common";
import { Component, ElementRef, input, output, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { ActionSheetController, IonButton } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
	selector: "bo-event-registration",
	templateUrl: "./event-registration.component.html",
	styleUrls: ["./event-registration.component.scss"],
	imports: [CommonModule, FormsModule, IonButton],
})
export class EventRegistrationComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<void>();

	uploadingRegistration = signal(false);

	@ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private eventService: EventsService,
		private sanitizer: DomSanitizer,
		private actionSheetController: ActionSheetController,
	) {}

	uploadRegistrationSelect() {
		this.registrationInput.nativeElement.click();
	}

	async uploadRegistration(input: HTMLInputElement) {
		const event = this.event();
		if (!event) return;

		if (!input.files?.length) return;

		const file = input.files[0];

		if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
			this.toastService.toast("Soubor musí být ve formátu PDF");
			return;
		}

		this.uploadingRegistration.set(true);

		try {
			await this.api.EventsApi.saveEventRegistration(event.id, file);
			this.update.emit();
			this.toastService.toast("Přihláška nahrána.");
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při nahrávání: " + err.message);
		} finally {
			this.uploadingRegistration.set(false);
			input.value = "";
		}
	}

	async generateRegistration() {
		const event = this.event();
		if (!event) return;

		let templates: SDK.RegistrationTemplateResponse[];
		try {
			templates = (await this.api.EventsApi.getEventRegistrationTemplates(event.id)).data;
		} catch {
			this.toastService.toast("Nepodařilo se načíst šablony přihlášky.");
			return;
		}

		if (!templates.length) {
			this.toastService.toast("Nejsou k dispozici žádné šablony přihlášky.");
			return;
		}

		const actionSheet = await this.actionSheetController.create({
			header: "Vyber šablonu přihlášky",
			buttons: [
				...templates.map((template) => ({
					text: template.name,
					handler: () => void this.generateWithTemplate(event.id, template.id),
				})),
				{ text: "Zrušit", role: "cancel" },
			],
		});
		await actionSheet.present();
	}

	private async generateWithTemplate(eventId: number, template: string) {
		this.uploadingRegistration.set(true);

		try {
			await this.api.EventsApi.generateEventRegistration(eventId, { template });
			this.update.emit();
			this.toastService.toast("Přihláška vygenerována.");
		} catch (err: any) {
			const message = err?.response?.data?.message ?? err.message;
			this.toastService.toast("Nastala chyba při generování: " + message);
		} finally {
			this.uploadingRegistration.set(false);
		}
	}

	async deleteRegistration() {
		const event = this.event();
		if (!event) return;

		await this.api.EventsApi.deleteEventRegistration(event.id);
		this.toastService.toast("Přihláška smazána.");
		this.update.emit();
	}

	async getRegistration() {
		const event = this.event();
		if (!event) return;

		const response = (await this.api.EventsApi.getEventRegistration(event.id, {
			responseType: "blob",
		})) as any;

		const fileBlob = new Blob([response.data], { type: "application/pdf" });
		const fileUrl = window.URL.createObjectURL(fileBlob);

		const link = document.createElement("a");
		link.href = fileUrl;
		link.target = "_blank";

		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		window.URL.revokeObjectURL(fileUrl);
	}
}
