import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GroupResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-group-view",
  templateUrl: "./group-view.component.html",
  styleUrls: ["./group-view.component.scss"],
})
export class GroupViewComponent implements OnInit {
  group?: GroupResponseWithLinks;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"]) this.loadGroup(parseInt(params["id"]));
    });
  }

  private async loadGroup(groupId: number) {
    this.group = await this.api.members.getGroup(groupId).then((res) => res.data);
  }
}
