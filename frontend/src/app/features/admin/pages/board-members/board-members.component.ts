import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
	IonIcon,
	IonList,
	IonReorder,
	IonReorderGroup,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { ItemReorderEventDetail } from "@ionic/core";
import { addIcons } from "ionicons";
import { addOutline, callOutline, mailOutline } from "ionicons/icons";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { BOARD_FUNCTIONS } from "src/app/core/config/board-functions";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-board-members",
	templateUrl: "./board-members.component.html",
	styleUrl: "./board-members.component.scss",
	imports: [
		RouterLink,
		IonList,
		IonReorderGroup,
		IonReorder,
		IonSkeletonText,
		IonSelect,
		IonSelectOption,
		IonIcon,
		PageHeaderComponent,
		PageContentComponent,
		ItemComponent,
		AvatarComponent,
		DeleteButtonComponent,
		TooltipDirective,
		MemberProfilePhotoUrlPipe,
	],
})
export class BoardMembersComponent implements ViewWillEnter {
	boardMembers = signal<SDK.BoardMemberResponseWithLinks[] | undefined>(undefined);

	loadingArray = new Array(6).fill(null);

	functions = BOARD_FUNCTIONS;

	canSave = computed(() => !!this.api.links()?.saveBoardMember?.allowed);
	canReorder = computed(
		() => !!this.api.links()?.updateBoardMembersOrder?.allowed && (this.boardMembers()?.length ?? 0) > 1,
	);

	actions = computed<Action[]>(() => [
		{
			text: "Přidat do vedení",
			icon: "add-outline",
			pinned: true,
			hidden: !this.canSave(),
			handler: () => this.add(),
		},
	]);

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ addOutline, mailOutline, callOutline });
	}

	ionViewWillEnter() {
		this.load();
	}

	async load() {
		const boardMembers = await this.api.MembersApi.listBoardMembers().then((res) => res.data);
		this.boardMembers.set(boardMembers);
	}

	functionOptions(boardMember: SDK.BoardMemberResponseWithLinks) {
		return this.functions.includes(boardMember.function)
			? this.functions
			: [boardMember.function, ...this.functions];
	}

	async add() {
		const selectedIds = computed(() => (this.boardMembers() ?? []).map((boardMember) => boardMember.memberId));

		await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				keepOpenAfterSelect: true,
				title: "Přidat do vedení",
				subtitle: "Vyber členy vedení skupiny. Funkci nastavíš v seznamu.",
				selectedIds,
				onSelect: async (member: SDK.MemberResponse) => {
					try {
						await this.api.MembersApi.saveBoardMember(member.id, {});
					} catch (e) {
						this.toastService.toast("Nepodařilo se přidat člena vedení.", { color: "danger" });
						return;
					}
					await this.load();
				},
				onDeselect: async (member: SDK.MemberResponse) => {
					const boardMember = this.boardMembers()?.find((item) => item.memberId === member.id);
					if (boardMember) await this.remove(boardMember);
				},
			},
			{ cssClass: "dialog-picker" },
		);
	}

	async setFunction(boardMember: SDK.BoardMemberResponseWithLinks, value: string) {
		if (!value || value === boardMember.function) return;

		try {
			await this.api.MembersApi.saveBoardMember(boardMember.memberId, { function: value });
		} catch (e) {
			this.toastService.toast("Nepodařilo se změnit funkci.", { color: "danger" });
		}

		await this.load();
	}

	async remove(boardMember: SDK.BoardMemberResponseWithLinks) {
		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chceš odebrat ${boardMember.member?.nickname ?? "člena"} z vedení skupiny?`,
			{ header: "Odebrat z vedení?", buttonText: "Odebrat" },
		);
		if (!confirmed) return;

		try {
			await this.api.MembersApi.deleteBoardMember(boardMember.memberId);
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat člena vedení.", { color: "danger" });
			return;
		}

		await this.load();
	}

	async onReorder(ev: CustomEvent<ItemReorderEventDetail>) {
		const boardMembers = this.boardMembers();
		if (!boardMembers) {
			ev.detail.complete();
			return;
		}

		const reordered = ev.detail.complete([...boardMembers]) as SDK.BoardMemberResponseWithLinks[];
		this.boardMembers.set(reordered.map((boardMember, position) => ({ ...boardMember, position })));

		try {
			await this.api.MembersApi.updateBoardMembersOrder({
				memberIds: reordered.map((boardMember) => boardMember.memberId),
			});
		} catch (e) {
			this.toastService.toast("Nepodařilo se změnit pořadí.", { color: "danger" });
			await this.load();
		}
	}
}
