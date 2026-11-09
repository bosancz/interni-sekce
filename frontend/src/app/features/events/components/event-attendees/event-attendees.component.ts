import { CommonModule, formatDate } from "@angular/common";
import { Component, computed, effect, input, OnDestroy, OnInit, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	alertCircle,
	checkmarkOutline,
	documentTextOutline,
	ellipse,
	giftOutline,
	helpCircle,
	barChartOutline,
	chevronDown,
	mailOutline,
	sendOutline,
	warning,
} from "ionicons/icons";
import { HealthSeverities } from "src/app/core/config/health-severity";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { getBirthdaysBetween } from "src/helpers/age";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { getMemberEmails } from "src/helpers/member-contacts";
import { SDK } from "src/sdk";
import { EventAgeModalComponent } from "../event-age-modal/event-age-modal.component";
import { EventAttendeesListComponent } from "../event-attendees-list/event-attendees-list.component";
import { AttendeeNote, AttendeeNoteTone } from "../event-attendees-list/attendee-note";

const compareLeaderPositions = (a: SDK.EventAttendeeResponseWithLinks, b: SDK.EventAttendeeResponseWithLinks) =>
	(a.position ?? Infinity) - (b.position ?? Infinity) ||
	(a.member?.nickname ?? "").localeCompare(b.member?.nickname ?? "", "cs") ||
	a.memberId - b.memberId;

interface SummaryProblemPerson {
	memberId: number;
	nickname?: string | null;
	detail?: string;
}

interface SummaryProblem {
	tone: AttendeeNoteTone;
	icon: string;
	label: string;
	people: SummaryProblemPerson[];
}

const TONE_ORDER: Record<AttendeeNoteTone, number> = {
	high: 0,
	medium: 1,
	birthday: 2,
	low: 3,
	unknown: 4,
	neutral: 5,
};

const peopleLabel = (count: number) => `${count} ${count === 1 ? "člověka" : "lidí"}`;

const addressesLabel = (count: number) => `${count} ${count === 1 ? "adresa" : count < 5 ? "adresy" : "adres"}`;

const withoutEmailLabel = (count: number) =>
	count === 1 ? "1 člověk nemá e-mail" : count < 5 ? `${count} lidé nemají e-mail` : `${count} lidí nemá e-mail`;

const notDeliveredLabel = (count: number) => `zpráva ${count === 1 ? "mu" : "jim"} nepřijde`;

const mailAddresses = (emails: string[]) =>
	emails.map((email) => encodeURIComponent(email).replace(/%40/g, "@")).join(",");

@UntilDestroy()
@Component({
	selector: "bo-event-attendees",
	templateUrl: "./event-attendees.component.html",
	styleUrls: ["./event-attendees.component.scss"],

	imports: [
		CommonModule,
		RouterLink,
		IonButton,
		IonIcon,
		TooltipDirective,
		EventAttendeesListComponent,
		AddButtonComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class EventAttendeesComponent implements OnInit, OnDestroy {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	change = output<void>();
	count = output<number | undefined>();

	attendees = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);
	leaders = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);

	canAddAttendee = computed(() => this.event()?._links?.addEventAttendee?.allowed ?? false);

	attendeesCount = computed(() => {
		const attendees = this.attendees();
		const leaders = this.leaders();
		if (attendees === undefined || leaders === undefined) return undefined;
		return attendees.length + leaders.length;
	});

	leaderMembers = computed(() => this.membersOf(this.leaders()));
	attendeeMembers = computed(() => this.membersOf(this.attendees()));
	allMembers = computed(() => [...this.leaderMembers(), ...this.attendeeMembers()]);

	birthdays = computed(() => {
		const event = this.event();
		if (!event) return [];

		return getBirthdaysBetween(this.allMembers(), event.dateFrom, event.dateTill);
	});

	people = computed(() => {
		const attendees = this.attendees();
		const leaders = this.leaders();
		if (attendees === undefined || leaders === undefined) return undefined;
		return [...leaders, ...attendees];
	});

	notes = computed(() => {
		const notes = new Map<number, AttendeeNote[]>();
		const add = (memberId: number, note: AttendeeNote) =>
			notes.set(memberId, [...(notes.get(memberId) ?? []), note]);

		for (const birthday of this.birthdays()) {
			add(birthday.member.id, {
				tone: "birthday",
				icon: "gift-outline",
				text: `${formatDate(birthday.date, "d. M.", "cs")} slaví ${birthday.age}. narozeniny`,
			});
		}

		for (const member of this.allMembers()) {
			const entries = [
				...(member.allergies ?? []).map((entry) => ({ ...entry, text: `Alergie: ${entry.name}` })),
				...(member.knownProblems ?? []).map((entry) => ({ ...entry, text: entry.name })),
			].sort((a, b) => HealthSeverities[b.severity].order - HealthSeverities[a.severity].order);

			for (const entry of entries) {
				add(member.id, {
					tone: entry.severity as AttendeeNoteTone,
					icon: HealthSeverities[entry.severity].icon,
					text: entry.text,
				});
			}
		}

		for (const item of this.announcementMissing()) {
			add(item.memberId, {
				tone: "neutral",
				icon: "document-text-outline",
				text: `Chybí k ohlášce: ${item.fields.join(", ")}`,
			});
		}

		return notes;
	});

	problems = computed(() => {
		const groups = new Map<string, SummaryProblem>();
		const add = (key: string, base: Omit<SummaryProblem, "people">, person: SummaryProblemPerson) => {
			const group = groups.get(key) ?? { ...base, people: [] };
			if (TONE_ORDER[base.tone] < TONE_ORDER[group.tone]) Object.assign(group, base, { people: group.people });
			if (!group.people.some((p) => p.memberId === person.memberId)) group.people.push(person);
			groups.set(key, group);
		};

		for (const birthday of this.birthdays()) {
			add(
				"birthday",
				{ tone: "birthday", icon: "gift-outline", label: "Narozeniny" },
				{
					memberId: birthday.member.id,
					nickname: birthday.member.nickname,
					detail: `${formatDate(birthday.date, "d. M.", "cs")}, ${birthday.age}`,
				},
			);
		}

		for (const member of this.allMembers()) {
			const person = { memberId: member.id, nickname: member.nickname };
			for (const entry of member.allergies ?? []) {
				add(
					`allergy:${entry.name.trim().toLocaleLowerCase("cs")}`,
					{
						tone: entry.severity as AttendeeNoteTone,
						icon: HealthSeverities[entry.severity].icon,
						label: `Alergie: ${entry.name.trim()}`,
					},
					person,
				);
			}
			for (const entry of member.knownProblems ?? []) {
				add(
					`problem:${entry.name.trim().toLocaleLowerCase("cs")}`,
					{
						tone: entry.severity as AttendeeNoteTone,
						icon: HealthSeverities[entry.severity].icon,
						label: entry.name.trim(),
					},
					person,
				);
			}
		}

		for (const item of this.announcementMissing()) {
			for (const field of item.fields) {
				add(
					`announcement:${field}`,
					{ tone: "neutral", icon: "document-text-outline", label: `Chybí k ohlášce: ${field}` },
					{ memberId: item.memberId, nickname: item.nickname },
				);
			}
		}

		return [...groups.values()]
			.map((group) => ({
				...group,
				people: group.people.sort((a, b) => (a.nickname ?? "").localeCompare(b.nickname ?? "", "cs")),
			}))
			.sort(
				(a, b) =>
					TONE_ORDER[a.tone] - TONE_ORDER[b.tone] ||
					b.people.length - a.people.length ||
					a.label.localeCompare(b.label, "cs"),
			);
	});

	summaryOpen = signal(false);

	announcementMissingLabel = computed(() => peopleLabel(this.announcementMissing().length));

	private attendeeEmails = computed(() => this.emailsOf(this.attendees()));

	private leaderEmails = computed(() => this.emailsOf(this.leaders()));

	mailTo = computed(() => (this.attendeeEmails().length ? this.attendeeEmails() : this.leaderEmails()));

	mailCc = computed(() => {
		const to = this.mailTo();
		return this.leaderEmails().filter((email) => !to.includes(email));
	});

	mailRecipients = computed(() => [...this.mailTo(), ...this.mailCc()]);

	membersWithoutEmail = computed(() => this.allMembers().filter((member) => !getMemberEmails(member).length));

	private mailUri = computed(() => {
		const to = this.mailTo();
		if (!to.length) return undefined;

		const cc = this.mailCc();
		const uri = `mailto:${mailAddresses(to)}`;

		return cc.length ? `${uri}?cc=${mailAddresses(cc)}` : uri;
	});

	mailto = computed(() => (this.membersWithoutEmail().length ? undefined : this.mailUri()));

	mailTooltip = computed(() => {
		const to = this.mailTo();
		if (!to.length) return "Nikdo na akci nemá vyplněný e-mail.";

		const cc = this.mailCc();
		const missing = this.membersWithoutEmail().length;

		const text = cc.length
			? `Napsat e-mail účastníkům akce (${addressesLabel(to.length)}), vedoucí jdou do kopie (${addressesLabel(cc.length)}). U dětí se použije výchozí kontakt na rodiče.`
			: `Napsat e-mail všem na akci (${addressesLabel(to.length)}). U dětí se použije výchozí kontakt na rodiče.`;

		return missing ? `${text} ${withoutEmailLabel(missing)}, ${notDeliveredLabel(missing)}.` : text;
	});

	readonly noPermissionText = "K této akci nemáš oprávnění.";

	announcementCheck = signal<SDK.EventAnnouncementCheckResponse | undefined>(undefined);
	sendingAnnouncement = signal(false);

	announcementSent = computed(() => !!this.event()?.announcementSentAt);
	announcementMissing = computed(() => this.announcementCheck()?.missing ?? []);

	showAnnouncement = computed(
		() =>
			!!this.attendeesCount() &&
			!!this.event()?._links?.checkEventAnnouncement?.allowed &&
			!!this.event()?._links?.sendEventAnnouncement?.applicable,
	);

	canSendAnnouncement = computed(() => {
		const link = this.event()?._links?.sendEventAnnouncement;
		return (
			!!link?.allowed &&
			!!link.applicable &&
			!!this.announcementCheck() &&
			!this.announcementMissing().length &&
			!this.sendingAnnouncement()
		);
	});

	sendAnnouncementTooltip = computed(() => {
		const link = this.event()?._links?.sendEventAnnouncement;
		if (!link?.allowed) return this.noPermissionText;
		if (this.announcementMissing().length) return "Nejdřív doplň chybějící údaje v databázi.";

		const recipient = this.announcementCheck()?.recipient;
		return recipient ? `Odešle ohlášku e-mailem na ${recipient}.` : null;
	});

	actions: Action[] = [];

	modal?: HTMLIonModalElement;

	openAgeModal() {
		const event = this.event();
		if (!event) return;
		this.modalService.componentModal(
			EventAgeModalComponent,
			{ event, attendees: this.attendees() ?? [], leaders: this.leaders() ?? [] },
			{ cssClass: "dialog-picker" },
		);
	}

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		addIcons({
			mailOutline,
			chevronDown,
			barChartOutline,
			sendOutline,
			checkmarkOutline,
			giftOutline,
			documentTextOutline,
			ellipse,
			alertCircle,
			warning,
			helpCircle,
		});

		effect(() => {
			const event = this.event();
			this.loadAttendees(event);
		});

		effect(() => this.count.emit(this.attendeesCount()));
	}

	ngOnInit(): void {}

	ngOnDestroy() {
		this.modal?.dismiss();
	}

	private async loadAttendees(event?: SDK.EventResponseWithLinks | null) {
		if (!event) {
			this.attendees.set(undefined);
			this.leaders.set(undefined);
			return;
		}

		this.loadAnnouncementCheck(event);

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

		attendees.sort((a, b) => {
			if (!a.member || !b.member) return 0;

			const aString = [a.member.nickname, a.member.firstName, a.member.lastName].join(" ");
			const bString = [b.member.nickname, b.member.firstName, b.member.lastName].join(" ");

			return b.role.localeCompare(a.role) || aString.localeCompare(bString);
		});

		this.attendees.set(attendees.filter((a) => a.type === "attendee"));
		this.leaders.set(attendees.filter((a) => a.type === "leader").sort(compareLeaderPositions));
	}

	private async loadAnnouncementCheck(event: SDK.EventResponseWithLinks) {
		if (!event._links.checkEventAnnouncement?.allowed || !event._links.sendEventAnnouncement?.applicable) {
			this.announcementCheck.set(undefined);
			return;
		}

		try {
			const check = await this.api.EventsApi.checkEventAnnouncement(event.id).then((res) => res.data);
			if (this.event()?.id === event.id) this.announcementCheck.set(check);
		} catch (e) {
			this.announcementCheck.set(undefined);
		}
	}

	private emailsOf(attendees?: SDK.EventAttendeeResponseWithLinks[]) {
		return [...new Set((attendees ?? []).flatMap((attendee) => getMemberEmails(attendee.member)))];
	}

	private membersOf(attendees?: SDK.EventAttendeeResponseWithLinks[]) {
		return (attendees ?? []).map((a) => a.member).filter((m): m is SDK.MemberResponse => !!m);
	}

	async sendMail() {
		const missing = this.membersWithoutEmail();
		if (!missing.length) return;

		const names = missing.map((member) => this.memberName(member) ?? "člen bez jména").join(", ");
		const message = `E-mail nemá vyplněný: ${names}. Doplň ho v databázi.`;
		const uri = this.mailUri();

		if (!uri) {
			await this.modalService.alertModal(message, { header: "Není komu napsat" });
			return;
		}

		const confirmed = await this.modalService.confirmationModal(message, {
			header: "Někomu chybí e-mail",
			buttonText: "Napsat ostatním",
		});
		if (!confirmed) return;

		window.location.href = uri;
	}

	async addAttendee() {
		const event = this.event();
		if (!event) return;

		const selectedIds = computed(() => (this.attendees() ?? []).map((attendee) => attendee.memberId));

		const addSelectedMember = async (member: SDK.MemberResponse) => {
			const existing = this.findAttendee(member.id);

			if (existing?.type === "leader") {
				const confirmation = await this.confirmLeaderDemotion(member);
				if (!confirmation) return;
			}

			try {
				if (existing) {
					await this.api.EventsApi.updateEventAttendee(event.id, member.id, { type: "attendee" });
				} else {
					await this.api.EventsApi.addEventAttendee(event.id, member.id, { type: "attendee" });
				}
			} catch (e) {
				this.toastService.toast("Nepodařilo se přidat účastníka.", { color: "danger" });
				return;
			}

			await this.loadAttendees(event);

			this.change.emit();
		};

		const removeSelectedMember = async (member: SDK.MemberResponse) => {
			const attendee = this.findAttendee(member.id);
			if (!attendee) return;

			if (!attendee._links.deleteEventAttendee.allowed) {
				this.toastService.toast("Tohoto účastníka nemůžete odebrat.", { color: "danger" });
				return;
			}

			try {
				await this.api.EventsApi.deleteEventAttendee(event.id, member.id);
			} catch (e) {
				this.toastService.toast("Nepodařilo se odebrat účastníka.", { color: "danger" });
				return;
			}

			await this.loadAttendees(event);

			this.change.emit();
		};

		const clearAllMembers = async () => {
			const removable = (this.attendees() ?? []).filter(
				(attendee) => attendee._links.deleteEventAttendee.allowed,
			);
			if (!removable.length) return;

			const confirmation = await this.modalService.deleteConfirmationModal(
				"Opravdu chcete odebrat všechny účastníky akce?",
				{ header: "Odebrat vše?", buttonText: "Odebrat" },
			);
			if (!confirmation) return;

			try {
				for (const attendee of removable) {
					await this.api.EventsApi.deleteEventAttendee(event.id, attendee.memberId);
				}
			} catch (e) {
				this.toastService.toast("Nepodařilo se odebrat účastníky.", { color: "danger" });
			}

			await this.loadAttendees(event);

			this.change.emit();
		};

		await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				keepOpenAfterSelect: true,
				allowCreate: true,
				title: "Přidat účastníky",
				subtitle: "Vyber účastníky ze svého oddílu.",
				selectedIds,
				onSelect: addSelectedMember,
				onDeselect: removeSelectedMember,
				onClearAll: clearAllMembers,
			},
			{ cssClass: "dialog-picker" },
		);
	}

	private memberName(member?: SDK.MemberResponse | null) {
		return member ? member.nickname || member.firstName || member.lastName || null : null;
	}

	private confirmLeaderRemoval(member?: SDK.MemberResponse | null) {
		const name = this.memberName(member);

		return this.modalService.deleteConfirmationModal(
			name ? `Opravdu chcete odebrat vedoucího akce ${name}?` : "Opravdu chcete odebrat vedoucího akce?",
			{ header: "Odebrat vedoucího?", buttonText: "Odebrat" },
		);
	}

	private confirmLeaderDemotion(member: SDK.MemberResponse) {
		const name = this.memberName(member);

		return this.modalService.deleteConfirmationModal(
			name
				? `${name} je vedoucí akce. Přidáním mezi účastníky přestane být vedoucí.`
				: "Tento člověk je vedoucí akce. Přidáním mezi účastníky přestane být vedoucí.",
			{ header: "Odebrat z vedoucích?", buttonText: "Přidat mezi účastníky" },
		);
	}

	private findAttendee(memberId: number) {
		return [...(this.attendees() ?? []), ...(this.leaders() ?? [])].find(
			(attendee) => attendee.memberId === memberId,
		);
	}

	async changeAttendeeRole(attendee: SDK.EventAttendeeResponseWithLinks, role: SDK.MemberRolesEnum) {
		const event = this.event();
		if (!event || attendee.role === role) return;

		const list = attendee.type === "leader" ? this.leaders : this.attendees;

		const previous = attendee.role;
		const update = (value: SDK.MemberRolesEnum) =>
			list.set(list()?.map((item) => (item.memberId === attendee.memberId ? { ...item, role: value } : item)));

		update(role);

		try {
			await this.api.EventsApi.updateEventAttendee(event.id, attendee.memberId, { role });
			this.toastService.toast("Role účastníka změněna.");
			this.change.emit();
		} catch (e) {
			update(previous);
			this.toastService.toast("Nepodařilo se změnit roli účastníka.");
		}
	}

	async changeEventLeader(attendee: SDK.EventAttendeeResponseWithLinks, lead: boolean) {
		const event = this.event();
		if (!event || (attendee.type === "leader") === lead) return;

		const name = this.memberName(attendee.member);

		if (!lead) {
			const confirmation = await this.modalService.deleteConfirmationModal(
				`${name ?? "Tento člověk"} přestane vést akci a zůstane na ní jako účastník.`,
				{ header: "Odebrat z vedení akce?", buttonText: "Odebrat z vedení" },
			);
			if (!confirmation) return;
		}

		try {
			await this.api.EventsApi.updateEventAttendee(event.id, attendee.memberId, {
				type: lead ? "leader" : "attendee",
			});
		} catch (e) {
			this.toastService.toast(
				lead ? "Nepodařilo se udělat z účastníka vedoucího akce." : "Nepodařilo se odebrat z vedení akce.",
				{ color: "danger" },
			);
			return;
		}

		await this.loadAttendees(event);
		this.toastService.toast(lead ? `${name ?? "Účastník"} teď vede akci.` : `${name ?? "Vedoucí"} už akci nevede.`);
		this.change.emit();
	}

	async reorderLeaders(memberIds: number[]) {
		const event = this.event();
		const leaders = this.leaders();
		if (!event || !leaders) return;

		const positions = new Map(memberIds.map((memberId, position) => [memberId, position]));
		this.leaders.set(
			leaders
				.map((leader) => ({ ...leader, position: positions.get(leader.memberId) ?? leader.position }))
				.sort(compareLeaderPositions),
		);

		try {
			await this.api.EventsApi.updateEventLeadersOrder(event.id, { memberIds });
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se změnit pořadí vedoucích.", { color: "danger" });
			await this.loadAttendees(event);
		}
	}

	async removeAttendee(attendee: SDK.EventAttendeeResponseWithLinks) {
		const event = this.event();
		if (!event) return;

		if (attendee.type === "leader") {
			const confirmation = await this.confirmLeaderRemoval(attendee.member);
			if (!confirmation) return;
		}

		try {
			this.attendees.set(this.attendees()?.filter((item) => item.memberId !== attendee.memberId));
			this.leaders.set(this.leaders()?.filter((item) => item.memberId !== attendee.memberId));

			await this.api.EventsApi.deleteEventAttendee(event.id, attendee.memberId);

			if (attendee.type === "leader") this.toastService.toast("Vedoucí odebrán.");
			else this.toastService.toast("Účastník odebrán.");

			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat účastníka.");
			await this.loadAttendees(event);
		}
	}

	toggleSliding(sliding: any) {
		sliding.getOpenAmount().then((open: number) => {
			if (open) sliding.close();
			else sliding.open();
		});
	}

	async sendAnnouncement() {
		const event = this.event();
		const check = this.announcementCheck();
		if (!event || !check || !this.canSendAnnouncement()) return;

		const count = this.attendeesCount() ?? 0;
		const sentAt = event.announcementSentAt;

		const message = [
			sentAt && `Ohláška už byla odeslána ${formatDate(sentAt, "d. M. y", "cs")}.`,
			`Ohláška akce ${event.name} se seznamem ${count} ${count === 1 ? "člověka" : "lidí"} odejde e-mailem na ${check.recipient}.`,
		]
			.filter(Boolean)
			.join(" ");

		const confirmed = await this.modalService.confirmationModal(message, {
			header: sentAt ? "Odeslat ohlášku znovu?" : "Odeslat ohlášku?",
			buttonText: "Odeslat",
		});
		if (!confirmed) return;

		this.sendingAnnouncement.set(true);

		try {
			const res = await this.api.EventsApi.sendEventAnnouncement(event.id).then((res) => res.data);
			this.toastService.toast(`Ohláška odeslána na ${res.recipient}.`);
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Ohlášku se nepodařilo odeslat.", { color: "danger" });
			this.loadAnnouncementCheck(event);
		} finally {
			this.sendingAnnouncement.set(false);
		}
	}
}
