import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { AlertController, ViewWillEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-deleted-members-list",
	templateUrl: "./deleted-members-list.component.html",
	styleUrls: ["./deleted-members-list.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		GroupBadgeComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		DatePipe,
	],
})
export class DeletedMembersListComponent implements ViewWillEnter {
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	rowActionsHeader = (member: SDK.MemberResponseWithLinks) => this.memberName(member);

	memberActions = (member: SDK.MemberResponseWithLinks): Action[] => [
		{
			text: "Obnovit",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !member._links.restoreMember.allowed,
			handler: () => this.restoreMember(member),
		},
		{
			text: "Smazat trvale",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !member._links.deleteMemberPermanent.allowed,
			handler: () => this.permanentlyDeleteMember(member),
		},
	];

	constructor(
		private api: ApiService,
		private alertController: AlertController,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadMembers();
	}

	memberName(member: SDK.MemberResponseWithLinks) {
		const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
		return member.nickname || name || `Člen ${member.id}`;
	}

	private async loadMembers() {
		const members = await this.api.MembersApi.listDeletedMembers().then((res) => res.data);
		this.members.set(members);
	}

	async restoreMember(member: SDK.MemberResponseWithLinks) {
		if (!member._links.restoreMember.allowed) return;

		await this.api.MembersApi.restoreMember(member.id);

		await this.loadMembers();

		await this.toastService.toast(`${this.memberName(member)} obnoven.`);
	}

	async permanentlyDeleteMember(member: SDK.MemberResponseWithLinks) {
		if (!member._links.deleteMemberPermanent.allowed) return;

		const alert = await this.alertController.create({
			header: `Trvale smazat ${this.memberName(member)}?`,
			message: "Tuto akci nelze vzít zpět.",
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{
					text: "Smazat trvale",
					role: "destructive",
					handler: async () => this.permanentlyDeleteMemberConfirmed(member),
				},
			],
		});

		alert.present();
	}

	private async permanentlyDeleteMemberConfirmed(member: SDK.MemberResponseWithLinks) {
		try {
			await this.api.MembersApi.deleteMemberPermanent(member.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Člena se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadMembers();

		await this.toastService.toast(`${this.memberName(member)} trvale smazán.`);
	}
}
