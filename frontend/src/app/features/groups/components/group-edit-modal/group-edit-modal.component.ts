import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, colorPaletteOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { GroupProfilePhotoComponent } from "../group-profile-photo/group-profile-photo.component";

export const GROUP_COLORS = ["#BB0000", "#FEC503", "#36802D", "#3880FF"];

@Component({
	selector: "bo-group-edit-modal",
	templateUrl: "./group-edit-modal.component.html",
	styleUrl: "./group-edit-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent, GroupProfilePhotoComponent],
})
export class GroupEditModalComponent extends InputModalComponent<SDK.GroupResponseWithLinks> implements OnInit {
	group!: SDK.GroupResponseWithLinks;

	currentGroup = signal<SDK.GroupResponseWithLinks | undefined>(undefined);

	name = signal("");
	shortName = signal("");
	color = signal<string | null>(null);
	active = signal(true);
	children = signal(true);

	saving = signal(false);
	error = signal<string | null>(null);

	readonly colors = GROUP_COLORS;

	isCustomColor = computed(() => {
		const color = this.color();
		return !!color && !this.colors.includes(color.toUpperCase());
	});

	previewGroup = computed(() => {
		const group = this.currentGroup();
		if (!group) return undefined;
		return { ...group, color: this.color(), shortName: this.shortName().trim() || group.shortName };
	});

	constructor(
		modalController: ModalController,
		private api: ApiService,
		private groupsService: GroupsService,
	) {
		super(modalController);
		addIcons({ checkmarkOutline, colorPaletteOutline });
	}

	ngOnInit(): void {
		this.currentGroup.set(this.group);
		this.name.set(this.group.name ?? "");
		this.shortName.set(this.group.shortName);
		this.color.set(this.group.color);
		this.active.set(this.group.active);
		this.children.set(this.group.children);
	}

	isSelected(color: string) {
		return this.color()?.toUpperCase() === color;
	}

	async reloadGroup() {
		this.currentGroup.set(await this.api.MembersApi.getGroup(this.group.id).then((res) => res.data));
	}

	async save() {
		const name = this.name().trim();
		const shortName = this.shortName().trim();

		if (!name) return this.error.set("Chybí název");
		if (!shortName) return this.error.set("Chybí zkratka");

		this.error.set(null);
		this.saving.set(true);

		try {
			await this.api.MembersApi.updateGroup(this.group.id, {
				name,
				shortName,
				color: this.color(),
				active: this.active(),
				children: this.children(),
			});
		} catch (err: any) {
			this.error.set(err?.response?.data?.message ?? "Oddíl se nepodařilo uložit.");
			return;
		} finally {
			this.saving.set(false);
		}

		this.groupsService.reload();
		this.submit.emit(await this.api.MembersApi.getGroup(this.group.id).then((res) => res.data));
	}
}
