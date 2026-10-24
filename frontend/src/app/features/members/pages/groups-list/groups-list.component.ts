import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, NavController, ViewWillEnter, ViewWillLeave } from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, personOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupProfilePhotoUrlPipe } from "src/app/shared/pipes/group-profile-photo-url.pipe";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-groups-list",
	templateUrl: "./groups-list.component.html",
	styleUrls: ["./groups-list.component.scss"],

	imports: [PageHeaderComponent, PageContentComponent, RouterLink, IonIcon, GroupProfilePhotoUrlPipe],
})
export class GroupsListComponent implements ViewWillEnter, ViewWillLeave {
	groups = signal<SDK.GroupResponseWithLinks[]>([]);

	totalChildrenCount = signal<number>(0);
	totalLeadersCount = signal<number>(0);

	showInactive = signal<boolean>(false);

	actions = signal<Action[]>([]);

	createGroupLink = signal<SDK.AcLink | null>(null);

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
		private navController: NavController,
	) {
		addIcons({ addOutline, personOutline, trashOutline });
	}

	openGroup(group: SDK.GroupResponseWithLinks) {
		this.navController.navigateForward(["/oddily", group.shortName]);
	}

	openDeletedGroups() {
		this.navController.navigateForward("/databaze/oddily/smazane");
	}

	ionViewWillEnter(): void {
		this.loadGroups();

		this.api.rootLinks.pipe(untilDestroyed(this, "ionViewWillLeave")).subscribe((links) => this.setActions(links));
	}

	ionViewWillLeave(): void {}

	private setActions(links: SDK.RootResponseLinks | null) {
		this.createGroupLink.set(links?.createGroup ?? null);

		this.actions.set([
			{
				text: "Nový oddíl",
				icon: "add-outline",
				pinned: true,
				hidden: !links?.createGroup.applicable || !links?.createGroup.allowed,
				handler: () => this.createGroup(),
			},
		]);
	}

	async createGroup() {
		const data = await this.modalService.inputModal<SDK.CreateGroupBody>({
			header: "Vytvořit oddíl",
			inputs: {
				name: { label: "Název", type: "text", required: true },
				shortName: { label: "Zkratka", type: "text", required: true },
			},
			buttonText: "Vytvořit",
		});
		if (data) this.onCreateGroup(data);
	}

	private onCreateGroup(groupData: SDK.CreateGroupBody) {
		if (!groupData.name || !groupData.shortName) {
			this.toastService.toast("Musíš vyplnit název i zkratku");
			return false;
		}

		this.createGroupConfirmed(groupData);
	}

	private async createGroupConfirmed(groupData: SDK.CreateGroupBody) {
		let group: SDK.GroupResponse;
		try {
			group = await this.api.MembersApi.createGroup(groupData).then((res) => res.data);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Oddíl se nepodařilo vytvořit.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} vytvořen.`);
	}

	toggleShowInactive() {
		this.showInactive.update((value) => !value);
		this.loadGroups();
	}

	private async loadGroups() {
		const groups = await this.api.MembersApi.listGroups({
			includeMemberCounts: true,
			active: this.showInactive() ? undefined : true,
		}).then((res) => res.data);
		groups.sort((a, b) =>
			(a.name ?? a.shortName).localeCompare(b.name ?? b.shortName, undefined, { numeric: true }),
		);

		this.groups.set(groups);

		this.totalChildrenCount.set(groups.reduce((sum, group) => sum + (group.childrenCount ?? 0), 0));
		this.totalLeadersCount.set(groups.reduce((sum, group) => sum + (group.leadersCount ?? 0), 0));
	}

	async deleteGroup(group: SDK.GroupResponseWithLinks) {
		const confirmed = await this.modalService.deleteConfirmationModal("Oddíl půjde obnovit ze smazaných oddílů.", {
			header: `Smazat ${group.name ?? group.id}?`,
		});
		if (confirmed) await this.deleteGroupConfirmed(group);
	}

	private async deleteGroupConfirmed(group: SDK.GroupResponseWithLinks) {
		await this.api.MembersApi.deleteGroup(group.id);

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} smazán.`);
	}
}
