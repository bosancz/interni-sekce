import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, closeOutline, colorPaletteOutline, personOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { InputModalComponent, ModalService } from "src/app/core/services/modal.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { GroupProfilePhotoComponent } from "../group-profile-photo/group-profile-photo.component";

export const GROUP_COLORS = ["#BB0000", "#FEC503", "#36802D", "#3880FF"];

export const GROUP_MEETING_DAYS: { value: SDK.GroupMeetingDaysEnum; label: string; title: string }[] = [
	{ value: "monday", label: "Po", title: "Pondělí" },
	{ value: "tuesday", label: "Út", title: "Úterý" },
	{ value: "wednesday", label: "St", title: "Středa" },
	{ value: "thursday", label: "Čt", title: "Čtvrtek" },
	{ value: "friday", label: "Pá", title: "Pátek" },
];

type GroupLeader = Pick<SDK.MemberResponse, "id" | "nickname" | "firstName" | "lastName">;

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
	meetingDay = signal<SDK.GroupMeetingDaysEnum | null>(null);
	leader = signal<GroupLeader | null>(null);

	saving = signal(false);
	error = signal<string | null>(null);

	readonly colors = GROUP_COLORS;
	readonly meetingDays = GROUP_MEETING_DAYS;

	leaderName = computed(() => {
		const leader = this.leader();
		return [leader?.firstName, leader?.lastName].filter(Boolean).join(" ");
	});

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
		private modalService: ModalService,
	) {
		super(modalController);
		addIcons({ checkmarkOutline, closeOutline, colorPaletteOutline, personOutline });
	}

	ngOnInit(): void {
		this.currentGroup.set(this.group);
		this.name.set(this.group.name ?? "");
		this.shortName.set(this.group.shortName);
		this.color.set(this.group.color);
		this.active.set(this.group.active);
		this.children.set(this.group.children);
		this.meetingDay.set(this.group.meetingDay);
		this.leader.set(this.group.leader ?? null);
	}

	async selectLeader() {
		const member = await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				title: "Oddílový vedoucí",
				subtitle: "Bude uvedený v kontaktech na bosan.cz.",
				roles: ["vedouci", "instruktor"],
			},
			{ cssClass: "dialog-picker" },
		);
		if (member) this.leader.set(member);
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
				meetingDay: this.meetingDay(),
				leaderId: this.leader()?.id ?? null,
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
