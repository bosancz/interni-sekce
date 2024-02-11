import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { IonSearchbar, ModalController, ViewDidEnter } from "@ionic/angular";
import { MemberResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { AbstractModalComponent } from "src/app/services/modal.service";

@Component({
  selector: "bo-member-selector-modal",
  templateUrl: "./member-selector-modal.component.html",
  styleUrls: ["./member-selector-modal.component.scss"],
})
export class MemberSelectorModalComponent
  extends AbstractModalComponent<MemberResponse>
  implements OnInit, ViewDidEnter
{
  @Input() members: MemberResponse[] = [];

  membersIndex: string[] = [];

  filteredMembers: MemberResponse[] = [];

  @ViewChild("searchBar") searchBar!: IonSearchbar;

  constructor(
    private api: ApiService,
    modalController: ModalController,
  ) {
    super(modalController);
  }

  ngOnInit(): void {
    this.loadMembers();
  }
  private async loadMembers() {
    if (this.members) this.members = await this.api.members.listMembers().then((res) => res.data);

    this.sortMembers();

    this.createIndex();

    this.searchMembers();
  }

  ionViewDidEnter() {
    window.setTimeout(() => this.searchBar.setFocus(), 300);
  }

  selectMember(member: MemberResponse) {
    this.submit.emit(member);
  }

  searchMembers(searchString?: string) {
    if (!searchString) {
      this.filteredMembers = this.members;
      return;
    }

    searchString = searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    const re = new RegExp("(^| )" + searchString, "i");

    this.filteredMembers = this.members.filter((member, i) => re.test(this.membersIndex[i]));
  }

  private createIndex() {
    this.membersIndex = this.members.map((member) => {
      return [member.nickname, member.firstName, member.lastName].filter((value) => !!value).join(" ");
    });
  }

  private sortMembers() {
    this.members.sort((a, b) => {
      const aString = a.nickname || a.firstName || a.lastName || "";
      const bString = b.nickname || b.firstName || b.lastName || "";
      return aString.localeCompare(bString);
    });
  }
}
