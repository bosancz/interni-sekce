import {
	Component,
	computed,
	ElementRef,
	inject,
	input,
	linkedSignal,
	OnInit,
	Signal,
	signal,
	ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonIcon, IonSpinner, ModalController, ViewDidEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, closeOutline, personAddOutline, searchOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { InputModalComponent, ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberCreateModalComponent } from "src/app/features/members/components/member-create-modal/member-create-modal.component";
import { MemberItemDetailComponent } from "src/app/shared/components/member-item-detail/member-item-detail.component";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../../../shared/pipes/group.pipe";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@Component({
	selector: "bo-member-selector-modal",
	templateUrl: "./member-selector-modal.component.html",
	styleUrls: ["./member-selector-modal.component.scss"],
	imports: [IonIcon, IonSpinner, ModalLayoutComponent, MemberItemDetailComponent, GroupPipe, MemberPipe],
})
export class MemberSelectorModalComponent
	extends InputModalComponent<SDK.MemberResponse>
	implements OnInit, ViewDidEnter
{
	members = input<SDK.MemberResponse[]>([]);
	keepOpenAfterSelect = false;
	roles?: SDK.MemberRolesEnum[];
	title = "Vybrat člověka";
	subtitle?: string;
	selectedIds?: Signal<number[]>;
	onSelect?: (member: SDK.MemberResponse) => void | Promise<void>;
	onDeselect?: (member: SDK.MemberResponse) => void | Promise<void>;
	onClearAll?: () => void | Promise<void>;

	query = signal("");
	groupFilter = signal<number | null>(null);
	loading = signal(true);
	clearing = signal(false);
	pendingIds = signal<number[]>([]);
	creating = signal(false);

	private api = inject(ApiService);
	private groupsService = inject(GroupsService);
	private modalService = inject(ModalService);
	private toastService = inject(ToastService);

	canCreate = computed(() => this.members().length === 0 && !!this.api.links()?.createMember?.allowed);

	private allMembers = signal<SDK.MemberResponse[]>([]);
	private groups = toSignal(this.groupsService.groups, { initialValue: [] as SDK.GroupResponseWithLinks[] });

	private membersIndex = computed(
		() =>
			new Map(
				this.allMembers().map((member) => [
					member.id,
					this.normalize([member.nickname, member.firstName, member.lastName].filter(Boolean).join(" ")),
				]),
			),
	);

	filteredMembers = computed(() => {
		const group = this.groupFilter();
		const query = this.normalize(this.query().trim());
		const index = this.membersIndex();

		return this.allMembers().filter(
			(member) =>
				(group === null || member.groupId === group) &&
				(!query || (index.get(member.id) ?? "").includes(query)),
		);
	});

	activeIndex = linkedSignal({ source: this.filteredMembers, computation: () => 0 });

	groupChips = computed(() => {
		const groupIds = new Set(this.allMembers().map((member) => member.groupId));
		return this.groups()
			.filter((group) => groupIds.has(group.id))
			.map((group) => ({ id: group.id, name: group.name ?? group.shortName }));
	});

	tagStyles = computed(() => new Map(this.groups().map((group) => [group.id, this.tagStyle(group.color)] as const)));

	private selectedIdsSet = computed(() => new Set(this.selectedIds?.() ?? []));

	selectedCount = computed(() => this.selectedIdsSet().size);

	selectedLabel = computed(() => {
		const count = this.selectedCount();
		if (count === 0) return "Nikdo nevybrán";
		if (count === 1) return "Vybrán 1 člověk";
		if (count < 5) return `Vybráni ${count} lidé`;
		return `Vybráno ${count} lidí`;
	});

	@ViewChild("searchInput") searchInput!: ElementRef<HTMLInputElement>;
	@ViewChild("list") list?: ElementRef<HTMLElement>;

	constructor() {
		super(inject(ModalController));
		addIcons({ checkmarkOutline, closeOutline, personAddOutline, searchOutline });
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
			this.allMembers.set(
				await this.api.MembersApi.listMembers({ limit: 1000, roles }).then((res) => this.sort(res.data)),
			);
		} else {
			this.allMembers.set(this.sort(inputMembers.filter((member) => !roles || roles.includes(member.role))));
		}

		this.loading.set(false);
	}

	ionViewDidEnter() {
		window.setTimeout(() => this.searchInput?.nativeElement.focus(), 300);
	}

	isSelected(memberId: number) {
		return this.selectedIdsSet().has(memberId);
	}

	isPending(memberId: number) {
		return this.pendingIds().includes(memberId);
	}

	clearQuery() {
		this.query.set("");
		this.searchInput?.nativeElement.focus();
	}

	onSearchKeydown(event: KeyboardEvent) {
		if (event.isComposing) return;

		const members = this.filteredMembers();

		switch (event.key) {
			case "ArrowDown":
			case "ArrowUp":
				event.preventDefault();
				if (!members.length) return;
				this.setActive(
					(this.activeIndex() + (event.key === "ArrowDown" ? 1 : -1) + members.length) % members.length,
				);
				break;

			case "Enter": {
				event.preventDefault();
				const member = members[this.activeIndex()];
				if (member) this.toggleMember(member);
				else if (!members.length && this.canCreate()) this.createMember();
				break;
			}
		}
	}

	setActive(index: number) {
		this.activeIndex.set(index);
		window.requestAnimationFrame(() =>
			this.list?.nativeElement.querySelectorAll(".mp-row")[index]?.scrollIntoView({ block: "nearest" }),
		);
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

	async clearAll() {
		if (!this.onClearAll || this.clearing()) return;

		this.clearing.set(true);
		try {
			await this.onClearAll();
		} finally {
			this.clearing.set(false);
		}
	}

	async createMember() {
		const nickname = this.query().trim();
		if (!this.canCreate() || !nickname || this.creating()) return;

		this.creating.set(true);
		try {
			const memberData = await this.modalService.componentModal(MemberCreateModalComponent, {
				defaultNickname: nickname,
				defaultGroupId: this.groupFilter(),
				allowedRoles: this.roles,
			});
			if (!memberData) return;

			const member = await this.api.MembersApi.createMember(memberData).then((res) => res.data);
			this.toastService.toast("Člen uložen.");

			this.allMembers.update((members) => this.sort([...members, member]));
			this.query.set("");
			this.groupFilter.set(null);

			await this.toggleMember(member);
		} finally {
			this.creating.set(false);
		}
	}

	private setPending(memberId: number, pending: boolean) {
		this.pendingIds.update((ids) => (pending ? [...ids, memberId] : ids.filter((id) => id !== memberId)));
	}

	private sort(members: SDK.MemberResponse[]) {
		return [...members].sort((a, b) => {
			const aString = a.nickname || a.firstName || a.lastName || "";
			const bString = b.nickname || b.firstName || b.lastName || "";
			return aString.localeCompare(bString);
		});
	}

	private normalize(value: string) {
		return value
			.toLocaleLowerCase()
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "");
	}

	private tagStyle(color?: string | null) {
		const rgb = this.parseColor(color);
		if (!rgb) return {};

		const [hue, saturation] = this.toHueSaturation(rgb);

		return {
			"--mp-tag-bg": `rgba(${rgb.join(", ")}, 0.16)`,
			"--mp-tag-fg": `hsl(${hue} ${saturation}% 32%)`,
			"--mp-tag-bg-dark": `rgba(${rgb.join(", ")}, 0.26)`,
			"--mp-tag-fg-dark": `hsl(${hue} ${saturation}% 74%)`,
		};
	}

	private parseColor(color?: string | null): [number, number, number] | null {
		const value = (color ?? "").trim().replace(/^#/, "");
		const hex =
			value.length === 3
				? value
						.split("")
						.map((char) => char + char)
						.join("")
				: value;

		if (!/^[0-9a-f]{6}$/i.test(hex)) return null;

		const number = parseInt(hex, 16);
		return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
	}

	private toHueSaturation([r, g, b]: [number, number, number]) {
		const [red, green, blue] = [r / 255, g / 255, b / 255];
		const max = Math.max(red, green, blue);
		const min = Math.min(red, green, blue);
		const delta = max - min;
		const lightness = (max + min) / 2;

		if (!delta) return [0, 0];

		const saturation = delta / (1 - Math.abs(2 * lightness - 1));

		let hue: number;
		if (max === red) hue = ((green - blue) / delta) % 6;
		else if (max === green) hue = (blue - red) / delta + 2;
		else hue = (red - green) / delta + 4;

		return [Math.round((((hue * 60) % 360) + 360) % 360), Math.round(saturation * 100)];
	}
}
