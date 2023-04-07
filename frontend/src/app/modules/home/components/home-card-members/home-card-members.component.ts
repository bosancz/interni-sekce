import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject } from "rxjs";
import { debounceTime, tap } from "rxjs/operators";
import { Member } from "src/app/schema/member";
import { ApiService } from "src/app/services/api.service";

@UntilDestroy()
@Component({
  selector: "bo-home-card-members",
  templateUrl: "./home-card-members.component.html",
  styleUrls: ["./home-card-members.component.scss"],
})
export class HomeCardMembersComponent implements OnInit {
  searchString = new Subject<string>();

  members?: Member[];

  searching: boolean = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.searchString
      .pipe(untilDestroyed(this))
      .pipe(tap((searchString) => (this.searching = !!searchString)))
      .pipe(debounceTime(500))
      .subscribe((searchString) => this.loadMembers(searchString));
  }

  async loadMembers(searchString: string) {
    console.log("search", searchString);
    this.searching = false;
    if (searchString) {
      this.members = await this.api.get<Member[]>("members", { search: searchString, limit: 3 });
    } else {
      this.clearMembers();
    }
  }

  clearMembers() {
    this.members = undefined;
  }
}
