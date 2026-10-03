import { DatePipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { IonIcon, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, closeOutline, warningOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent, ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { SDK } from "src/sdk";

type Side = "a" | "b";

type MergeField = Exclude<SDK.MemberMergeFieldsEnum, "user">;

interface MergeFieldDefinition {
	field: MergeField;
	label: string;
	kind?: "group" | "photo";
	value: (member: SDK.MemberResponseWithLinks) => string | null;
}

interface MergeRow extends MergeFieldDefinition {
	a: string | null;
	b: string | null;
	same: boolean;
}

export interface MemberMergeResult {
	targetId: number;
}

@Component({
	selector: "bo-member-merge-modal",
	templateUrl: "./member-merge-modal.component.html",
	styleUrl: "./member-merge-modal.component.scss",
	imports: [IonIcon, IonSpinner, ModalLayoutComponent, GroupPipe, MemberProfilePhotoUrlPipe],
	providers: [DatePipe],
})
export class MemberMergeModalComponent extends InputModalComponent<MemberMergeResult> implements OnInit {
	memberAId!: number;
	memberBId!: number;

	private api = inject(ApiService);
	private modalService = inject(ModalService);
	private toastService = inject(ToastService);
	private datePipe = inject(DatePipe);

	memberA = signal<SDK.MemberResponseWithLinks | null>(null);
	memberB = signal<SDK.MemberResponseWithLinks | null>(null);
	info = signal<SDK.MemberMergeInfoResponse | null>(null);
	loading = signal(true);
	merging = signal(false);
	error = signal<string | null>(null);

	target = signal<Side>("a");
	selection = signal<Partial<Record<MergeField | "user", Side>>>({});

	readonly fields: MergeFieldDefinition[] = [
		{
			field: "profilePhoto",
			label: "Profilová fotka",
			kind: "photo",
			value: (m) => (m.profilePhotoUpdatedAt ? "ano" : null),
		},
		{ field: "nickname", label: "Přezdívka", value: (m) => m.nickname || null },
		{ field: "firstName", label: "Jméno", value: (m) => m.firstName || null },
		{ field: "lastName", label: "Příjmení", value: (m) => m.lastName || null },
		{ field: "birthday", label: "Datum narození", value: (m) => this.formatDate(m.birthday) },
		{ field: "groupId", label: "Oddíl", kind: "group", value: (m) => (m.groupId ? String(m.groupId) : null) },
		{ field: "role", label: "Role", value: (m) => (m.role ? (MemberRoles[m.role]?.title ?? m.role) : null) },
		{ field: "rank", label: "Hodnost", value: (m) => (m.rank ? (MemberRoles[m.rank]?.title ?? m.rank) : null) },
		{ field: "function", label: "Funkce", value: (m) => m.function || null },
		{ field: "active", label: "Aktivní", value: (m) => (m.active === undefined ? null : m.active ? "Ano" : "Ne") },
		{ field: "address", label: "Adresa", value: (m) => this.formatAddress(m) },
		{ field: "mobile", label: "Telefon", value: (m) => m.mobile || null },
		{ field: "email", label: "E-mail", value: (m) => m.email || null },
		{ field: "knownProblems", label: "Zdravotní problémy", value: (m) => this.formatHealth(m.knownProblems) },
		{ field: "allergies", label: "Alergie", value: (m) => this.formatHealth(m.allergies) },
		{
			field: "insuranceCard",
			label: "Kartička pojištěnce",
			value: (m) =>
				m.insuranceCardFile
					? m.insuranceCardExpiration
						? `platná do ${this.formatDate(m.insuranceCardExpiration)}`
						: "nahraná"
					: null,
		},
	];

	rows = computed<MergeRow[]>(() => {
		const a = this.memberA();
		const b = this.memberB();
		if (!a || !b) return [];

		return this.fields.map((definition) => {
			const valueA = definition.value(a);
			const valueB = definition.value(b);
			const same = definition.kind === "photo" ? !valueA && !valueB : valueA === valueB;
			return { ...definition, a: valueA, b: valueB, same };
		});
	});

	sideA = computed(() => this.side("a"));
	sideB = computed(() => this.side("b"));

	hasUserChoice = computed(() => !!this.sideA()?.user && !!this.sideB()?.user);

	targetMember = computed(() => (this.target() === "a" ? this.memberA() : this.memberB()));
	sourceMember = computed(() => (this.target() === "a" ? this.memberB() : this.memberA()));

	sharedEvents = computed(() => this.info()?.sharedEvents ?? 0);
	sharedMembershipYears = computed(() => this.info()?.sharedMembershipYears ?? []);

	lostUser = computed(() => {
		const a = this.sideA()?.user;
		const b = this.sideB()?.user;
		if (!a || !b) return null;
		return this.selection().user === "a" ? b : a;
	});

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline, closeOutline, warningOutline });
	}

	async ngOnInit() {
		try {
			const [a, b, info] = await Promise.all([
				this.api.MembersApi.getMember(this.memberAId).then((res) => res.data),
				this.api.MembersApi.getMember(this.memberBId).then((res) => res.data),
				this.api.MembersApi.getMemberMergeInfo(this.memberAId, { sourceMemberId: this.memberBId }).then(
					(res) => res.data,
				),
			]);

			this.memberA.set(a);
			this.memberB.set(b);
			this.info.set(info);
			this.selection.set(this.defaultSelection());
		} catch (e) {
			this.error.set("Členy se nepodařilo načíst.");
		} finally {
			this.loading.set(false);
		}
	}

	setTarget(side: Side) {
		this.target.set(side);
	}

	select(field: MergeField | "user", side: Side) {
		this.selection.update((selection) => ({ ...selection, [field]: side }));
	}

	isSelected(field: MergeField | "user", side: Side) {
		return this.selection()[field] === side;
	}

	async merge() {
		const target = this.targetMember();
		const source = this.sourceMember();
		if (!target || !source || this.merging()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Člen <strong>${this.escape(this.memberName(source))}</strong> bude sloučen do člena <strong>${this.escape(this.memberName(target))}</strong> a smazán. Tuto akci nelze vrátit zpět.`,
			{ header: "Opravdu sloučit?", buttonText: "Sloučit" },
		);
		if (!confirmed) return;

		const sourceSide: Side = this.target() === "a" ? "b" : "a";
		const fieldsFromSource = Object.entries(this.selection())
			.filter(([, side]) => side === sourceSide)
			.map(([field]) => field as SDK.MemberMergeFieldsEnum);

		this.merging.set(true);

		try {
			await this.api.MembersApi.mergeMember(target.id, { sourceMemberId: source.id, fieldsFromSource });
			this.submit.emit({ targetId: target.id });
		} catch (e) {
			this.toastService.toast("Sloučení se nepodařilo.", { color: "danger" });
		} finally {
			this.merging.set(false);
		}
	}

	memberName(member: SDK.MemberResponse | null | undefined) {
		if (!member) return "";
		const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
		return member.nickname ? (name ? `${member.nickname} (${name})` : member.nickname) : name || `#${member.id}`;
	}

	private side(side: Side) {
		const info = this.info();
		const id = side === "a" ? this.memberAId : this.memberBId;
		if (!info) return null;
		return info.target.memberId === id ? info.target : info.source;
	}

	private defaultSelection() {
		const selection: Partial<Record<MergeField | "user", Side>> = {};

		for (const row of this.rows()) selection[row.field] = !row.a && row.b ? "b" : "a";

		const userA = this.sideA()?.user;
		const userB = this.sideB()?.user;
		if (userA || userB) selection.user = !userA && userB ? "b" : "a";

		return selection;
	}

	private formatDate(value?: string | null) {
		return value ? this.datePipe.transform(value, "d. M. y") : null;
	}

	private formatAddress(member: SDK.MemberResponse) {
		const street = [member.addressStreet, member.addressStreetNo].filter(Boolean).join(" ");
		const city = [member.addressPostalCode, member.addressCity].filter(Boolean).join(" ");
		return [street, city, member.addressCountry].filter(Boolean).join(", ") || null;
	}

	private formatHealth(entries?: SDK.HealthEntryDto[] | null) {
		return entries?.length ? entries.map((entry) => entry.name).join(", ") : null;
	}

	private escape(value: string) {
		return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
	}
}
