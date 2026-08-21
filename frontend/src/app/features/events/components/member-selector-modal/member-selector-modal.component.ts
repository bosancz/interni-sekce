import { CommonModule } from "@angular/common";
import { Component, computed, input, OnInit, Signal, signal, ViewChild } from "@angular/core";
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSearchbar,
	IonSpinner,
	IonToolbar,
	ModalController,
	ViewDidEnter,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkbox, checkmarkCircle, ellipseOutline, squareOutline } from "ionicons/icons";
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
		IonIcon,
		IonSpinner,
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
	roles?: SDK.MemberRolesEnum[];
	selectedIds?: Signal<number[]>;
	onSelect?: (member: SDK.MemberResponse) => void | Promise<void>;
	onDeselect?: (member: SDK.MemberResponse) => void | Promise<void>;

	membersIndex: string[] = [];

	filteredMembers = signal<SDK.MemberResponse[]>([]);
	pendingIds = signal<number[]>([]);
	loading = signal(true);

	private selectedIdsSet = computed(() => new Set(this.selectedIds?.() ?? []));

	selectedCount = computed(() => this.selectedIdsSet().size);

	selectedLabel = computed(() => {
		const count = this.selectedCount();
		if (count === 0) return "Zatím nikdo není vybraný";
		if (count === 1) return "Vybrán 1 člověk";
		if (count < 5) return `Vybráni ${count} lidé`;
		return `Vybráno ${count} lidí`;
	});

	private _members: SDK.MemberResponse[] = [];

	@ViewChild("searchBar") searchBar!: IonSearchbar;

	constructor(
		private api: ApiService,
		modalController: ModalController,
	) {
		super(modalController);
		addIcons({ checkbox, checkmarkCircle, ellipseOutline, squareOutline });
	}

	get selectable() {
		return !!this.selectedIds;
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

		this.loading.set(false);
	}

	ionViewDidEnter() {
		window.setTimeout(() => this.searchBar.setFocus(), 300);
	}

	isSelected(memberId: number) {
		return this.selectedIdsSet().has(memberId);
	}

	isPending(memberId: number) {
		return this.pendingIds().includes(memberId);
	}

	async toggleMember(member: SDK.MemberResponse) {
		if (this.isPending(member.id)) return;

		const selected = this.isSelected(member.id);
		if (selected && !this.onDeselect) return;

		const handler = selected ? this.onDeselect : this.onSelect;

		if (handler) {
			this.setPending(member.id, true);
			try {
				await handler(member);
			} finally {
				this.setPending(member.id, false);
			}
		}

		if (!selected && !this.keepOpenAfterSelect) this.submit.emit(member);
	}

	searchMembers(searchString?: string) {
		if (!searchString) {
			this.filteredMembers.set(this._members);
			return;
		}

		searchString = searchString.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&");
		const re = new RegExp("(^| )" + searchString, "i");

		this.filteredMembers.set(this._members.filter((member, i) => re.test(this.membersIndex[i])));
	}

	private setPending(memberId: number, pending: boolean) {
		this.pendingIds.update((ids) => (pending ? [...ids, memberId] : ids.filter((id) => id !== memberId)));
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
