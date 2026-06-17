import { CommonModule } from "@angular/common";
import { Component, ElementRef, input, output, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { AlertController, IonButton, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { cloudUploadOutline, colorWandOutline, eyeOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
	selector: "bo-event-registration",
	templateUrl: "./event-registration.component.html",
	styleUrls: ["./event-registration.component.scss"],
	imports: [CommonModule, FormsModule, IonButton, IonIcon],
})
export class EventRegistrationComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<void>();

	uploadingRegistration = signal(false);

	private readonly colors = [
		{ id: "black", name: "Černá" },
		{ id: "blue", name: "Modrá" },
		{ id: "green", name: "Zelená" },
		{ id: "red", name: "Červená" },
		{ id: "yellow", name: "Žlutá" },
	];

	@ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private eventService: EventsService,
		private sanitizer: DomSanitizer,
		private alertController: AlertController,
	) {
		addIcons({ cloudUploadOutline, colorWandOutline, eyeOutline, trashOutline });
	}

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

		const colorAlert = await this.alertController.create({
			header: "Vyber barvu",
			inputs: this.colors.map((color, i) => ({
				type: "radio" as const,
				label: color.name,
				value: color.id,
				cssClass: `color-radio color-${color.id}`,
				checked: i === 0,
			})),
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Dál", handler: (color: string) => void this.selectTemplate(event.id, color, templates) },
			],
		});
		await colorAlert.present();
	}

	private async selectTemplate(eventId: number, color: string, templates: SDK.RegistrationTemplateResponse[]) {
		const templateAlert = await this.alertController.create({
			header: "Vyber šablonu přihlášky",
			inputs: templates.map((template, i) => ({
				type: "radio" as const,
				label: template.name,
				value: template.id,
				checked: i === 0,
			})),
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Generovat", handler: (templateId: string) => void this.generateWithTemplate(eventId, templateId, color) },
			],
		});
		await templateAlert.present();
	}

	private async generateWithTemplate(eventId: number, template: string, color: string) {
		this.uploadingRegistration.set(true);

		try {
			await this.api.EventsApi.generateEventRegistration(eventId, { template, color });
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
