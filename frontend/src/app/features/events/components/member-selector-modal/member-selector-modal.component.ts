import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonItem,
	IonLabel,
	IonList,
	IonSearchbar,
	IonToolbar,
	ModalController,
	ViewDidEnter,
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { AbstractModalComponent } from "src/app/core/services/modal.service";
import { MemberItemDetailComponent } from "src/app/shared/components/member-item-detail/member-item-detail.component";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../../../shared/pipes/group.pipe";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@Component({
	selector: "bo-member-selector-modal",
	templateUrl: "./member-selector-modal.component.html",
	styleUrls: ["./member-selector-modal.component.scss"],
	imports: [
		CommonModule,
		IonSearchbar,
		IonToolbar,
		IonButtons,
		IonButton,
		IonList,
		IonItem,
		IonLabel,
		IonBadge,
		MemberItemDetailComponent,
		GroupPipe,
		MemberPipe,
	],
})
export class MemberSelectorModalComponent
	extends AbstractModalComponent<SDK.MemberResponse>
	implements OnInit, ViewDidEnter
{
	@Input() members: SDK.MemberResponse[] = [];

	membersIndex: string[] = [];

	filteredMembers: SDK.MemberResponse[] = [];

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
		if (this.members) this.members = await this.api.MembersApi.listMembers({ limit: 1000 }).then((res) => res.data);

		this.sortMembers();

		this.createIndex();

		this.searchMembers();
	}

	ionViewDidEnter() {
		window.setTimeout(() => this.searchBar.setFocus(), 300);
	}

	selectMember(member: SDK.MemberResponse) {
		this.submit.emit(member);
	}

	searchMembers(searchString?: string) {
		if (!searchString) {
			//NOTE: Chceme zobrazit vsechny cleny, pokud neni nic zadano do vyhledavani stejne tak nikdo nebude vyhledavat ne?
			this.filteredMembers = this.members;
			return;
		}

		searchString = searchString.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&"); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
		const re = new RegExp("(^| )" + searchString, "i");

		console.log("Searching members for:", searchString, this.membersIndex, this.filteredMembers);

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
