import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Platform } from "@ionic/angular";
import { EventResponse } from "src/app/api";
import { DocumentAction } from "src/app/schema/api-document";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "event-card",
  templateUrl: "./event-card.component.html",
  styleUrls: ["./event-card.component.scss"],
})
export class EventCardComponent implements OnInit {
  @Input()
  event?: EventResponse;

  @Input()
  set eventId(eventId: number) {
    this.loadEvent(eventId);
  }

  @Input() actions: boolean = false;
  @Input() open: boolean = false;

  @Output()
  change = new EventEmitter<Event>();

  constructor(private api: ApiService, public platform: Platform) {}

  ngOnInit() {}

  async loadEvent(eventId: number) {
    this.event = await this.api.events.getEvent(eventId).then((res) => res.data);
  }

  async reload() {
    if (this.event && this.event._id) return this.loadEvent(this.event._id);
  }

  async eventAction(action: DocumentAction, takeNote: boolean = false) {
    let note: string = "";

    if (takeNote) {
      const promptResult = window.prompt("Poznámka k vrácení akce:");

      // hit cancel in the prompt cancels the action
      if (promptResult === null) return;

      note = promptResult;
    }

    await this.api.post(action, { note: note || undefined });

    await this.reload();
    this.change.emit(this.event);
  }
}
