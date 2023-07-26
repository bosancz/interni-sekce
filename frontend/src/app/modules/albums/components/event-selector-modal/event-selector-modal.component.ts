import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-event-selector-modal",
  templateUrl: "./event-selector-modal.component.html",
  styleUrls: ["./event-selector-modal.component.scss"],
})
export class EventSelectorModalComponent implements OnInit {
  events: EventResponseWithLinks[] = [];

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

    // TODO: use params
    this.events = await this.api.events.listEvents().then((res) => res.data);
  }

  close(eventId?: EventResponseWithLinks["id"]) {
    this.modalController.dismiss({ event: eventId });
  }
}
