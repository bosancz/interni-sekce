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
			this.uploadingRegistration = false

			return;
		}
		
		this.uploadingRegistration = true;

		try {
			await this.api.EventsApi.saveEventRegistration(this.event.id, file);
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při nahrávání: " + err.message);
			return;
		} finally{
			this.uploadingRegistration = false
		}

		this.toastService.toast("Přihláška nahrána.");

		this.event = await this.eventService.loadEvent(this.event.id);
	}

	async deleteRegistration() {
		if (!this.event) return;

		await this.api.EventsApi.deleteEventRegistration(this.event.id);
		this.toastService.toast("Přihláška smazána.");
		this.event = await this.eventService.loadEvent(this.event.id);
	}

	async getRegistration() {
		if (!this.event) return;
	
		const response = await this.api.EventsApi.getEventRegistration(
            this.event.id, 
            { responseType: 'blob' }
        ) as any;        
		
		const fileBlob = new Blob([response.data], { type: 'application/pdf' });
		const fileUrl = window.URL.createObjectURL(fileBlob);
		
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        
        // 4. Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(fileUrl);
	}

}
