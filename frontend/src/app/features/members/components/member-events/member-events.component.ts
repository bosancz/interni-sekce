import { DatePipe } from "@angular/common";
import { Component, effect, input, signal, untracked, viewChild } from "@angular/core";
import { ApiService } from "src/app/core/services/api.service";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { EventHoverPreviewComponent } from "src/app/shared/components/event-hover-preview/event-hover-preview.component";
import { EventLeadersInlineComponent } from "src/app/shared/components/event-leaders-inline/event-leaders-inline.component";
import { EventStatusBadgeComponent } from "src/app/shared/components/event-status-badge/event-status-badge.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-events",
	templateUrl: "./member-events.component.html",
	styleUrl: "./member-events.component.scss",
	imports: [
		DatePipe,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		EventStatusBadgeComponent,
		EventLeadersInlineComponent,
		EventHoverPreviewComponent,
	],
})
export class MemberEventsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	active = input(true);

	events = signal<SDK.EventResponseWithLinks[]>([]);
	loading = signal(false);
	sort = signal<string>("dateFrom");
	order = signal<string>("DESC");

	private preview = viewChild.required(EventHoverPreviewComponent);
	private loadedFor?: string;

	rowLink = (event: SDK.EventResponseWithLinks) => ["/akce", event.id];
	rowId = (event: SDK.EventResponseWithLinks) => "event-" + event.id;

	constructor(private api: ApiService) {
		effect(() => {
			const member = this.member();
			const active = this.active();
			const key = member ? `${member.id}-${this.sort()}-${this.order()}` : undefined;
			if (!member || !active || key === this.loadedFor) return;
			this.loadedFor = key;
			untracked(() => this.load(member.id));
		});

		effect(() => {
			if (this.active()) this.preview().resume();
			else this.preview().pause();
		});
	}

	pause() {
		this.preview().pause();
	}

	resume() {
		if (this.active()) this.preview().resume();
	}

	async load(memberId: number) {
		this.loading.set(true);
		try {
			const events = await this.api.EventsApi.listEvents({
				leaderId: memberId,
				sort: this.sort(),
				order: this.order(),
			}).then((res) => res.data);
			if (this.member()?.id === memberId) this.events.set(events);
		} finally {
			this.loading.set(false);
		}
	}

	onSortChange(sort: AdminTableSort) {
		this.sort.set(sort.sort);
		this.order.set(sort.order);
	}
}
