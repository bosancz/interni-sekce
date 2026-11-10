import { Component, computed, input, output, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PlatformService } from "src/app/core/services/platform.service";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { flag, flagOutline, swapHorizontalOutline, trashOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/core/config/member-roles";
import { GroupsService } from "src/app/core/services/groups.service";
import { UserSettingsService } from "src/app/core/services/user-settings.service";
import { ModalService } from "src/app/core/services/modal.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { ColumnsSelectComponent } from "src/app/shared/components/columns-select/columns-select.component";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { RolePipe } from "../../../../shared/pipes/role.pipe";
import { AttendeeNote } from "./attendee-note";

type Attendee = SDK.EventAttendeeResponseWithLinks;

const ROLE_ORDER = Object.keys(MemberRoles) as SDK.MemberRolesEnum[];

const ROLE_SORT_ORDER = [...ROLE_ORDER].reverse();

const collator = new Intl.Collator("cs");

const ATTENDEES_COLUMNS: FilterPillOption[] = [
	{ value: "photo", label: "Fotka" },
	{ value: "firstName", label: "Jméno" },
	{ value: "lastName", label: "Příjmení" },
	{ value: "group", label: "Oddíl" },
	{ value: "role", label: "Role" },
	{ value: "age", label: "Věk" },
	{ value: "notes", label: "Poznámky" },
];

const SORT_OPTIONS: SortOption[] = [
	{ key: "nickname", label: "Přezdívka" },
	{ key: "firstName", label: "Jméno" },
	{ key: "lastName", label: "Příjmení" },
	{ key: "group", label: "Oddíl" },
	{ key: "role", label: "Role" },
	{ key: "age", label: "Věk" },
];

const normalize = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

@Component({
	selector: "bo-event-attendees-list",
	templateUrl: "./event-attendees-list.component.html",
	styleUrl: "./event-attendees-list.component.scss",

	imports: [
		IonIcon,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AvatarComponent,
		ColumnsSelectComponent,
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
		GroupBadgeComponent,
		GroupPipe,
		MemberPipe,
		MemberProfilePhotoUrlPipe,
		RolePipe,
	],
})
export class EventAttendeesListComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	attendees = input<Attendee[] | undefined>();
	notes = input<Map<number, AttendeeNote[]>>(new Map());

	remove = output<Attendee>();
	roleChange = output<{ attendee: Attendee; role: SDK.MemberRolesEnum }>();
	leadChange = output<{ attendee: Attendee; lead: boolean }>();

	private readonly savedColumns = this.userSettings.watch("eventAttendeesColumns");

	readonly columnOptions = ATTENDEES_COLUMNS;

	columns = computed(() => {
		const saved = this.savedColumns();
		return Object.fromEntries(ATTENDEES_COLUMNS.map(({ value }) => [value, saved?.[value] ?? true]));
	});

	selectedColumns = computed(() =>
		Object.entries(this.columns())
			.filter(([, visible]) => visible)
			.map(([key]) => key),
	);

	readonly sortOptions = SORT_OPTIONS;

	search = signal<string>("");

	isDesktop = toSignal(this.platformService.isLg, { initialValue: true });

	sort = signal<string | null>("role");
	order = signal<"ASC" | "DESC">("ASC");

	private readonly groups = toSignal(this.groupsService.groups);

	sortedAttendees = computed(() => {
		const attendees = this.attendees();
		const sort = this.sort();
		if (!attendees || !sort) return attendees;

		const key = this.sortKey(sort);
		const direction = this.order() === "ASC" ? 1 : -1;
		return [...attendees].sort((a, b) => {
			const leaderA = a.type === "leader" ? 0 : 1;
			const leaderB = b.type === "leader" ? 0 : 1;
			if (leaderA !== leaderB) return leaderA - leaderB;
			const valueA = key(a);
			const valueB = key(b);
			if (valueA === valueB) return this.compareNicknames(a, b);
			if (valueA === null) return 1;
			if (valueB === null) return -1;
			const result =
				typeof valueA === "number" && typeof valueB === "number"
					? valueA - valueB
					: collator.compare(String(valueA), String(valueB));
			return result * direction || this.compareNicknames(a, b);
		});
	});

	filteredAttendees = computed(() => {
		const attendees = this.sortedAttendees();
		const search = normalize(this.search().trim());
		if (!attendees || !search) return attendees;
		return attendees.filter((attendee) => {
			const member = attendee.member;
			const text = [member?.nickname, member?.firstName, member?.lastName].filter(Boolean).join(" ");
			return normalize(text).includes(search);
		});
	});

	rowLink = (attendee: Attendee) => ["/databaze/clenove", attendee.memberId];

	trackBy = (_: number, attendee: Attendee) => attendee.memberId;

	rowClass = (attendee: Attendee) => ({
		"member-vedouci": attendee.role === "vedouci",
		"member-instruktor": attendee.role === "instruktor",
		"attendee-festive": (this.notes().get(attendee.memberId) ?? []).some((note) => note.tone === "birthday"),
	});

	rowActionsHeader = (attendee: Attendee) => this.nickname(attendee);

	attendeeActions = (attendee: Attendee): Action[] => {
		const canUpdate = attendee._links.updateEventAttendee.allowed;
		return [
			{
				text: "Povýšit na vedoucího akce",
				icon: flagOutline,
				hidden: !canUpdate || attendee.type === "leader" || attendee.role === SDK.MemberRolesEnum.Dite,
				handler: () => this.leadChange.emit({ attendee, lead: true }),
			},
			{
				text: "Odebrat z vedení akce",
				icon: flagOutline,
				hidden: !canUpdate || attendee.type !== "leader",
				handler: () => this.leadChange.emit({ attendee, lead: false }),
			},
			{
				text: "Změnit roli na akci",
				icon: swapHorizontalOutline,
				hidden: !canUpdate,
				handler: () => this.changeRole(attendee),
			},
			{
				text: "Odebrat z akce",
				role: "destructive",
				color: "danger",
				icon: trashOutline,
				hidden: !attendee._links.deleteEventAttendee.allowed,
				handler: () => this.remove.emit(attendee),
			},
		];
	};

	constructor(
		private readonly groupsService: GroupsService,
		private readonly modalService: ModalService,
		private readonly userSettings: UserSettingsService,
		private readonly platformService: PlatformService,
	) {
		addIcons({ flag });
	}

	onFilterChange(filter: FilterData) {
		this.search.set(String(filter["search"] ?? ""));
	}

	setColumns(keys: string[]) {
		const selected = new Set(keys);
		this.userSettings.set(
			"eventAttendeesColumns",
			Object.fromEntries(ATTENDEES_COLUMNS.map(({ value }) => [value, selected.has(value)])),
		);
	}

	setSort(sort: AdminTableSort) {
		this.sort.set(sort.sort);
		this.order.set(sort.order);
	}

	async changeRole(attendee: Attendee) {
		const role = await this.modalService.selectModal<SDK.MemberRolesEnum>({
			header: "Role na akci",
			message: this.nickname(attendee),
			values: ROLE_SORT_ORDER.map((value) => ({ value, label: MemberRoles[value].title })),
			value: attendee.role,
			buttonText: "Uložit",
		});
		if (role && role !== attendee.role) this.roleChange.emit({ attendee, role });
	}

	private sortKey(sort: string): (attendee: Attendee) => string | number | null {
		switch (sort) {
			case "firstName":
				return (a) => [a.member?.firstName, a.member?.lastName].filter(Boolean).join(" ") || null;
			case "lastName":
				return (a) => [a.member?.lastName, a.member?.firstName].filter(Boolean).join(" ") || null;
			case "group":
				return (a) => {
					const groupId = a.member?.groupId;
					return this.groups()?.find((group) => group.id === groupId)?.name ?? null;
				};
			case "age":
				return (a) => {
					const birthday = a.member?.birthday;
					return birthday ? -DateTime.fromISO(birthday).toMillis() : null;
				};
			case "role":
				return (a) => (a.role ? ROLE_SORT_ORDER.indexOf(a.role) : null);
			default:
				return (a) => this.nickname(a) || null;
		}
	}

	private compareNicknames(a: Attendee, b: Attendee) {
		return collator.compare(this.nickname(a), this.nickname(b));
	}

	private nickname(attendee: Attendee) {
		return attendee.member?.nickname || attendee.member?.firstName || "";
	}
}
