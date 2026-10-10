import { Component, input, output, signal } from "@angular/core";
import { IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cameraOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { GroupProfilePhotoUrlPipe } from "src/app/shared/pipes/group-profile-photo-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-group-profile-photo",
	templateUrl: "./group-profile-photo.component.html",
	styleUrl: "./group-profile-photo.component.scss",
	imports: [IonButton, IonIcon, IonSpinner, TooltipDirective, GroupProfilePhotoUrlPipe],
})
export class GroupProfilePhotoComponent {
	group = input<SDK.GroupResponseWithLinks | null | undefined>();

	change = output<void>();

	uploading = signal(false);

	constructor(
		private api: ApiService,
		private groupsService: GroupsService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ cameraOutline, trashOutline });
	}

	async onPhotoSelected(input: HTMLInputElement) {
		const file = input.files?.[0];
		input.value = "";

		const group = this.group();
		if (!file || !group) return;

		this.uploading.set(true);
		try {
			await this.api.MembersApi.uploadGroupProfilePhoto(group.id, file);
			this.afterPhotoChange();
			this.toastService.toast("Fotka oddílu nahrána.", { color: "success" });
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Fotku se nepodařilo nahrát.";
			this.toastService.toast(message, { color: "danger", duration: 4000 });
		} finally {
			this.uploading.set(false);
		}
	}

	async deletePhoto() {
		const group = this.group();
		if (!group) return;

		const confirmed = await this.modalService.deleteConfirmationModal("Profilová fotka oddílu bude odebrána.", {
			header: "Odebrat fotku?",
			buttonText: "Odebrat",
		});
		if (!confirmed) return;

		await this.api.MembersApi.deleteGroupProfilePhoto(group.id);
		this.afterPhotoChange();
		this.toastService.toast("Fotka oddílu odebrána.");
	}

	private afterPhotoChange() {
		this.groupsService.reload();
		this.change.emit();
	}
}
