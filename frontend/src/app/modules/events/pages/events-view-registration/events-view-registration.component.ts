import { Component, ElementRef, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { UntilDestroy } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { EventResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
  selector: "events-view-registration",
  templateUrl: "./events-view-registration.component.html",
  styleUrls: ["./events-view-registration.component.scss"],
})
export class EventsViewRegistrationComponent {
  event?: EventResponse;

  uploadingRegistration: boolean = false;

  actions: Action[] = [];

  @ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private eventService: EventsService,
    private sanitizer: DomSanitizer,
  ) {
    this.eventService.event$.pipe(filter((event) => !!event)).subscribe((event) => this.updateEvent(event!));
  }

  private updateEvent(event: EventResponse) {
    this.event = event;
    this.setActions(event);
  }

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

  getRegistrationUrl(event: EventResponse) {
    return event._links.getEventRegistration.href;
  }

  getSafeRegistrationUrl(event: EventResponse) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getRegistrationUrl(event));
  }

  setActions(event: EventResponse) {
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
