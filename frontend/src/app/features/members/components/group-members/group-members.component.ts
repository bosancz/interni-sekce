import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { GroupsService } from "../../services/groups.service";

@UntilDestroy()
@Component({
	selector: "bo-group-members",
	templateUrl: "./group-members.component.html",
	styleUrls: ["./group-members.component.scss"],
	imports: [
		CommonModule,
		FilterComponent,
		IonItem,
		IonLabel,
		IonSelect,
		IonSelectOption,
		IonList,
		IonSkeletonText,
		FormsModule,
		RouterLink,
		MemberPipe,
	],
})
export class GroupMembersComponent implements OnInit {
	members = signal<(SDK.MemberResponseWithLinks & { searchString?: string })[] | undefined>(undefined);
	filteredMembers = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	sortField = signal<"nickname" | "age">("nickname");

	filter = signal<{ search: string }>({
		search: "",
	});

	constructor(
		private api: ApiService,
		private groupsService: GroupsService,
	) {}

	ngOnInit(): void {
		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => this.loadMembers(group?.id));
	}

	onFilterChange(value: { search?: string }) {
		this.filter.update((filter) => ({ ...filter, search: value.search ?? "" }));
		this.filterMembers();
	}

	private async loadMembers(groupId?: number) {
		if (!groupId) {
			this.members.set(undefined);
			return;
		}

		const members = await this.api.MembersApi.listMembers({ groups: [groupId] }).then((res) => res.data);

		members.forEach((member) => {
			(member as SDK.MemberResponseWithLinks & { searchString?: string }).searchString = [
				member.nickname,
				member.firstName,
				member.lastName,
			].join(" ");
		});

		this.members.set(members);

		this.sortMembers();
		this.filterMembers();
	}

	sortMembers() {
		this.members.update((members) => {
			members?.sort((a, b) => {
				switch (this.sortField()) {
					case "nickname":
						return a.nickname.localeCompare(b.nickname);
					case "age":
						return (a.birthday || "").localeCompare(b.birthday || "");
					default:
						return 0;
				}
			});
			return members;
		});
	}

	filterMembers() {
		const search = this.filter().search;
		const search_re = search
			? new RegExp("(^| )" + search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
			: undefined;

		this.filteredMembers.set(
			this.members()?.filter((member) => {
				if (search_re && !search_re.test(member.searchString!)) return false;
				return true;
			}),
		);
	}
}
