import { Component, signal } from "@angular/core";
import { IonButton, IonIcon, IonItem, IonLabel, IonList, ViewWillEnter } from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-groups-deleted",
	templateUrl: "./groups-deleted.component.html",
	styleUrls: ["./groups-deleted.component.scss"],
	imports: [PageHeaderComponent, PageContentComponent, IonList, IonItem, IonLabel, IonButton, IonIcon],
})
export class GroupsDeletedComponent implements ViewWillEnter {
	groups = signal<SDK.GroupResponseWithLinks[]>([]);

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadGroups();
	}

	private async loadGroups() {
		const groups = await this.api.MembersApi.listGroups({ includeDeleted: true }).then((res) => res.data);
		groups.sort((a, b) =>
			(a.name ?? a.shortName).localeCompare(b.name ?? b.shortName, undefined, { numeric: true }),
		);
		this.groups.set(groups);
	}

	async restoreGroup(group: SDK.GroupResponseWithLinks) {
		if (!group._links.restoreGroup.allowed) return;

		await this.api.MembersApi.restoreGroup(group.id);

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} obnoven.`);
	}

	async permanentlyDeleteGroup(group: SDK.GroupResponseWithLinks) {
		if (!group._links.permanentlyDeleteGroup.allowed) return;

		const confirmed = await this.modalService.deleteConfirmationModal("Tuto akci nelze vzít zpět.", {
			header: `Trvale smazat ${group.name ?? group.id}?`,
			buttonText: "Smazat trvale",
		});
		if (confirmed) await this.permanentlyDeleteGroupConfirmed(group);
	}

	private async permanentlyDeleteGroupConfirmed(group: SDK.GroupResponseWithLinks) {
		try {
			await this.api.MembersApi.permanentlyDeleteGroup(group.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Oddíl se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} trvale smazán.`);
	}
}
