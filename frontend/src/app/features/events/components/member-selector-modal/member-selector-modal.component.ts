import { CommonModule } from "@angular/common";
import { Component, input, OnInit, signal, ViewChild } from "@angular/core";
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
import { InputModalComponent } from "src/app/core/services/modal.service";
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
	extends InputModalComponent<SDK.MemberResponse>
	implements OnInit, ViewDidEnter
{
	members = input<SDK.MemberResponse[]>([]);
	keepOpenAfterSelect = false;
	// omezení výběru na dané role, ostatní členy modal vůbec nenabídne
	roles?: SDK.MemberRolesEnum[];
	onSelect?: (member: SDK.MemberResponse) => void;

	membersIndex: string[] = [];

	filteredMembers = signal<SDK.MemberResponse[]>([]);
	private _members: SDK.MemberResponse[] = [];

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
		const roles = this.roles;

		const inputMembers = this.members();
		if (inputMembers && inputMembers.length === 0) {
			this._members = await this.api.MembersApi.listMembers({ limit: 1000, roles }).then((res) => res.data);
		} else {
			this._members = (inputMembers || []).filter((member) => !roles || roles.includes(member.role));
		}

		this.sortMembers();

		this.createIndex();

		this.searchMembers();
	}

	ionViewDidEnter() {
		window.setTimeout(() => this.searchBar.setFocus(), 300);
	}

	selectMember(member: SDK.MemberResponse) {
		this.onSelect?.(member);
		if (this.keepOpenAfterSelect) return;

		this.submit.emit(member);
	}

	searchMembers(searchString?: string) {
		if (!searchString) {
			//NOTE: Chceme zobrazit vsechny cleny, pokud neni nic zadano do vyhledavani stejne tak nikdo nebude vyhledavat ne?
			this.filteredMembers.set(this._members);
			return;
		}

		searchString = searchString.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&"); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
		const re = new RegExp("(^| )" + searchString, "i");

		this.filteredMembers.set(this._members.filter((member, i) => re.test(this.membersIndex[i])));
	}

	private createIndex() {
		this.membersIndex = this._members.map((member) => {
			return [member.nickname, member.firstName, member.lastName].filter((value) => !!value).join(" ");
		});
	}

	private sortMembers() {
		this._members.sort((a, b) => {
			const aString = a.nickname || a.firstName || a.lastName || "";
			const bString = b.nickname || b.firstName || b.lastName || "";
			return aString.localeCompare(bString);
		});
	}
}
