import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
  selector: "bo-event-registration",
  templateUrl: "./event-registration.component.html",
  styleUrls: ["./event-registration.component.scss"],
})
export class EventRegistrationComponent {
  @Input() event?: EventResponseWithLinks;

  uploadingRegistration: boolean = false;

  actions: Action[] = [];

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
      await this.api.events.saveEventRegistration(this.event.id, { registration: file });
    } catch (err: any) {
      this.toastService.toast("Nastala chyba při nahrávání: " + err.message);
    }

    this.uploadingRegistration = false;
    this.toastService.toast("Přihláška nahrána.");

    this.eventService.loadEvent(this.event.id);
  }

  async deleteRegistration() {
    if (!this.event) return;

    await this.api.events.deleteEventRegistration(this.event.id);
    this.toastService.toast("Přihláška smazána.");

    this.eventService.loadEvent(this.event.id);
  }

  private downloadRegistration() {
    if (!this.event) return;
    window.open(this.getRegistrationUrl(this.event));
  }

  getRegistrationUrl(event: EventResponseWithLinks) {
    return event._links.getEventRegistration.href;
  }

  getSafeRegistrationUrl(event: EventResponseWithLinks) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getRegistrationUrl(event));
  }

  setActions(event: EventResponseWithLinks) {
    this.actions = [
      {
        text: "Stáhnout",
        hidden: !event._links.getEventRegistration.applicable,
        disabled: !event._links.getEventRegistration.allowed,
        handler: () => this.downloadRegistration(),
      },
      {
        text: "Nahrát",
        hidden: !event._links.getEventRegistration.allowed,
        handler: () => this.uploadRegistrationSelect(),
      },
      {
        text: "Smazat",
        role: "destructive",
        color: "danger",
        hidden: !event?._links.getEventRegistration.allowed,
        handler: () => this.deleteRegistration(),
      },
    ];
  }
}
