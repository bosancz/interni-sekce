import { DatePipe, NgTemplateOutlet } from "@angular/common";
import {
	Component,
	computed,
	contentChild,
	contentChildren,
	Directive,
	input,
	output,
	TemplateRef,
	viewChildren,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PlatformService } from "src/app/core/services/platform.service";
import { SDK } from "src/sdk";
import { Action } from "../action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "../admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "../admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort, AdminTableSortOrder } from "../admin-table/admin-table.component";
import { AvatarComponent } from "../avatar/avatar.component";
import { GroupBadgeComponent } from "../group-badge/group-badge.component";
import { MemberBadgesInlineComponent } from "../member-badges-inline/member-badges-inline.component";
import { DefaultContactPipe } from "../../pipes/default-contact.pipe";
import { GroupPipe } from "../../pipes/group.pipe";
import { MemberProfilePhotoUrlPipe } from "../../pipes/member-profile-photo-url.pipe";
import { MemberPipe } from "../../pipes/member.pipe";
import { RolePipe } from "../../pipes/role.pipe";
import { PEOPLE_BADGE_COLUMNS, PEOPLE_COLUMNS, PEOPLE_SORT_KEYS } from "./people-columns";

type RowFn<T> = ((row: any) => T) | null;

@Directive({ selector: "[boPeopleNicknameSuffix]" })
export class PeopleNicknameSuffixDirective {
	constructor(public readonly template: TemplateRef<{ $implicit: any }>) {}

	static ngTemplateContextGuard(_dir: PeopleNicknameSuffixDirective, _ctx: unknown): _ctx is { $implicit: any } {
		return true;
	}
}

@Component({
	selector: "bo-people-table",
	templateUrl: "./people-table.component.html",
	styleUrl: "./people-table.component.scss",
	imports: [
		NgTemplateOutlet,
		DatePipe,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AvatarComponent,
		GroupBadgeComponent,
		MemberBadgesInlineComponent,
		DefaultContactPipe,
		GroupPipe,
		MemberPipe,
		MemberProfilePhotoUrlPipe,
		RolePipe,
	],
})
export class PeopleTableComponent {
	rows = input<readonly any[] | null | undefined>(undefined);
	loading = input<boolean>(false);
	skeletonRows = input<number>(5);
	rowLink = input<RowFn<any[] | string | null | undefined>>(null);
	rowClass = input<RowFn<string | Record<string, boolean> | null | undefined>>(null);
	trackBy = input<((index: number, row: any) => any) | null>(null);
	actions = input<((row: any) => Action[]) | null>(null);
	actionsHeader = input<((row: any) => string | null | undefined) | null>(null);
	sort = input<string | null>(null);
	order = input<AdminTableSortOrder>("ASC");
	sortChange = output<AdminTableSort>();

	visible = input.required<{ [key: string]: boolean }>();
	columnOrder = input<string[]>(PEOPLE_COLUMNS);
	rightColumn = input<string>("group");
	sortable = input<string[] | null>(null);

	member = input<(row: any) => SDK.MemberResponse | undefined>((row) => row);
	role = input<((row: any) => SDK.MemberRolesEnum | undefined) | null>(null);
	ageAt = input<string | null | undefined>(null);

	readonly nicknameSuffix = contentChild(PeopleNicknameSuffixDirective);

	private readonly builtInColumns = viewChildren(AdminTableColumnComponent);
	private readonly customColumns = contentChildren(AdminTableColumnComponent);

	readonly isDesktop = toSignal(this.platformService.isLg, { initialValue: true });

	readonly columns = computed(() => {
		const definitions = new Map(
			[...this.builtInColumns(), ...this.customColumns()].map((column) => [column.key(), column]),
		);
		const visible = this.visible();
		let keys = this.columnOrder().filter((key) => visible[key]);

		if (!this.isDesktop()) {
			const badgesIndex = keys.findIndex((key) => PEOPLE_BADGE_COLUMNS.includes(key));
			if (badgesIndex >= 0) {
				keys = keys.filter((key) => !PEOPLE_BADGE_COLUMNS.includes(key));
				keys.splice(badgesIndex, 0, "badges");
			}
		}

		return keys
			.map((key) => definitions.get(key))
			.filter((column): column is AdminTableColumnComponent => !!column);
	});

	constructor(private readonly platformService: PlatformService) {}

	memberOf(row: any): SDK.MemberResponse | undefined {
		return this.member()(row);
	}

	roleOf(row: any): SDK.MemberRolesEnum | undefined {
		const role = this.role();
		return role ? role(row) : this.memberOf(row)?.role;
	}

	sortKey(column: string): string {
		const key = PEOPLE_SORT_KEYS[column];
		if (!key) return "";
		const sortable = this.sortable();
		return !sortable || sortable.includes(key) ? key : "";
	}
}
