import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { SDK } from "src/sdk";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
	selector: "bo-event-registration",
	templateUrl: "./event-registration.component.html",
	styleUrls: ["./event-registration.component.scss"],
	standalone: false,
})
export class EventRegistrationComponent {
	@Input() event?: SDK.EventResponseWithLinks;

	uploadingRegistration: boolean = false;

	@ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private eventService: EventsService,
		private sanitizer: DomSanitizer,
	) {}

	uploadRegistrationSelect() {
		this.registrationInput.nativeElement.click();
	}

	async uploadRegistration(input: HTMLInputElement) {
		if (!this.event) return;

		if (!input.files?.length) return;

		let file = input.files![0];

		if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
			this.toastService.toast("Soubor musí být ve formátu PDF");
			return;
		}

		this.uploadingRegistration = true;

		try {
			await this.api.EventsApi.saveEventRegistration(this.event.id, { registration: file });
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při nahrávání: " + err.message);
		}

		this.uploadingRegistration = false;
		this.toastService.toast("Přihláška nahrána.");

		this.eventService.loadEvent(this.event.id);
	}

	async deleteRegistration() {
		if (!this.event) return;

		await this.api.EventsApi.deleteEventRegistration(this.event.id);
		this.toastService.toast("Přihláška smazána.");

		this.eventService.loadEvent(this.event.id);
	}

	private downloadRegistration() {
		if (!this.event) return;
		window.open(this.getRegistrationUrl(this.event));
	}

	getRegistrationUrl(event: SDK.EventResponseWithLinks) {
		return event._links.getEventRegistration.href;
	}

	getSafeRegistrationUrl(event: SDK.EventResponseWithLinks) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(this.getRegistrationUrl(event));
	}
}
