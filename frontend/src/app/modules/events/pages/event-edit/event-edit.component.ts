import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { EventResponseWithLinks, MemberResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventsService } from "../../services/events.service";

@Component({
  selector: "event-edit",
  templateUrl: "./event-edit.component.html",
  styleUrls: ["./event-edit.component.scss"],
})
export class EventEditComponent implements OnInit {
  event?: EventResponseWithLinks;

  members: MemberResponse[] = [];

  actions: Action[] = [
    {
      text: "Uložit",
      handler: () => this.saveEvent(),
    },
  ];

  @ViewChild("eventForm") form!: NgForm;

  constructor(
    private eventsService: EventsService,
    private api: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.eventsService.event$.subscribe((event) => {
      this.event = event;
    });

    this.route.params.subscribe((params) => {
      this.eventsService.loadEvent(params["event"]);
    });

    this.loadMembers();
  }

  private async loadMembers() {
    const options = {
      select: "_id nickname name group",
    };

    // TODO: use options to list members

    this.members = await this.api.members.listMembers().then((res) => res.data);
  }

  async saveEvent() {
    if (!this.event) return;

    const eventData: Partial<EventResponseWithLinks> = this.form.value;

    // prevent switched date order
    if (eventData.dateFrom && eventData.dateTill) {
      const dates = [eventData.dateFrom, eventData.dateTill];
      dates.sort();
      eventData.dateFrom = dates[0];
      eventData.dateTill = dates[1];
    }

    // eventData.leaders = eventData.leaders?.map(member => member._id) || [];

    await this.api.events.updateEvent(this.event.id, eventData);
    this.toastService.toast("Uloženo.");

    // this.router.navigate(["../info"], { relativeTo: this.route, replaceUrl: true });
    this.navController.navigateBack(["/akce", this.event.id]);
  }
}
