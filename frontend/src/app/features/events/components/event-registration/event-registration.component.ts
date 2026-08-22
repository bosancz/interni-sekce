import { CommonModule } from "@angular/common";
import { Component, computed, ElementRef, input, output, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { AlertController, IonButton, IonIcon } from "@ionic/angular/standalone";
import { AlertButton } from "@ionic/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { cloudUploadOutline, colorWandOutline, eyeOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { EventRegistrationPreviewModalComponent } from "../event-registration-preview-modal/event-registration-preview-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
	selector: "bo-event-registration",
	templateUrl: "./event-registration.component.html",
	styleUrls: ["./event-registration.component.scss"],
	imports: [CommonModule, FormsModule, IonButton, IonIcon, TooltipDirective],
})
export class EventRegistrationComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<void>();

	uploadingRegistration = signal(false);
	generatingRegistration = signal(false);

	busy = computed(() => this.uploadingRegistration() || this.generatingRegistration());

	private readonly colors = [
		{ id: "black", name: "Černá" },
		{ id: "blue", name: "Modrá" },
		{ id: "green", name: "Zelená" },
		{ id: "red", name: "Červená" },
		{ id: "orange", name: "Žlutá" },
	];

	@ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private eventService: EventsService,
		private sanitizer: DomSanitizer,
		private alertController: AlertController,
		private modalService: ModalService,
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

		if (!event.leaders?.length) {
			this.toastService.toast("Akce nemá vedoucího, přihlášku nelze vygenerovat.");
			return;
		}

		if (event.hasRegistration && !(await this.confirmOverwriteRegistration(event))) return;

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

	private async confirmOverwriteRegistration(event: SDK.EventResponseWithLinks): Promise<boolean> {
		return new Promise<boolean>(async (resolve) => {
			const buttons: AlertButton[] = [{ text: "Zrušit", role: "cancel", handler: () => resolve(false) }];

			if (event._links?.getEventRegistration?.allowed) {
				buttons.push({
					text: "Zobrazit existující přihlášku",
					handler: () => {
						void this.getRegistration();
						resolve(false);
					},
				});
			}

			buttons.push({ text: "Ano, vygenerovat novou", handler: () => resolve(true) });

			const alert = await this.alertController.create({
				header: "Přepsat přihlášku?",
				message: "Nová přihláška nahradí tu, co je u akce nahraná — až ji publikuješ.",
				buttons,
			});

			alert.onDidDismiss().then(() => resolve(false));
			await alert.present();
		});
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
				{
					text: "Dál",
					handler: (templateId: string) => void this.promptNoteAndGenerate(eventId, templateId, color),
				},
			],
		});
		await templateAlert.present();
	}

	private async promptNoteAndGenerate(eventId: number, template: string, color: string) {
		const note = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Doplňující informace (nepovinné)",
			placeholder: "Např. platební instrukce…",
			value: "",
		});

		await this.generateWithTemplate(eventId, template, color, note ?? undefined);
	}

	private async generateWithTemplate(eventId: number, template: string, color: string, note?: string) {
		this.generatingRegistration.set(true);

		let registration: Blob;
		try {
			const response = (await this.api.EventsApi.generateEventRegistration(
				eventId,
				{ template, color, note },
				{ responseType: "blob" },
			)) as any;
			registration = new Blob([response.data], { type: "application/pdf" });
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při generování: " + (await this.errorMessage(err)));
			return;
		} finally {
			this.generatingRegistration.set(false);
		}

		await this.previewRegistration(eventId, registration);
	}

	private async previewRegistration(eventId: number, registration: Blob) {
		const url = window.URL.createObjectURL(registration);

		try {
			const publish = await this.modalService.componentModal(
				EventRegistrationPreviewModalComponent,
				{ src: this.sanitizer.bypassSecurityTrustResourceUrl(url + "#navpanes=0&view=Fit"), url },
				{ cssClass: "dialog-preview", backdropDismiss: false },
			);

			if (publish) await this.publishRegistration(eventId, registration);
		} finally {
			setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
		}
	}

	private async publishRegistration(eventId: number, registration: Blob) {
		this.uploadingRegistration.set(true);

		try {
			const file = new File([registration], "prihlaska.pdf", { type: "application/pdf" });
			await this.api.EventsApi.saveEventRegistration(eventId, file);
			this.update.emit();
			this.toastService.toast("Přihláška publikována.");
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při publikování: " + (await this.errorMessage(err)));
		} finally {
			this.uploadingRegistration.set(false);
		}
	}

	private async errorMessage(err: any): Promise<string> {
		const data = err?.response?.data;

		if (data instanceof Blob) {
			try {
				return JSON.parse(await data.text()).message ?? err.message;
			} catch {
				return err.message;
			}
		}

		return data?.message ?? err.message;
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
		link.rel = "noopener";

		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);

		setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60_000);
	}
}
