import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-event-selector-modal",
  templateUrl: "./event-selector-modal.component.html",
  styleUrls: ["./event-selector-modal.component.scss"],
})
export class EventSelectorModalComponent implements OnInit {
  events: Event[] = [];

  constructor(private api: ApiService, private modalController: ModalController) {}

  ngOnInit(): void {
    this.searchEvents();
  }

  async searchEvents(searchString?: string) {
    const params = {
      search: searchString || undefined,
      sort: "-dateFrom",
      limit: 20,
    };

    this.events = await this.api.get<Event[]>("events", params);
  }

  close(eventId?: Event["_id"]) {
    this.modalController.dismiss({ event: eventId });
  }
}
