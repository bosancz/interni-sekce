import { CommonModule } from "@angular/common";
import { Component, computed, effect, input, OnDestroy, OnInit, output, signal } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { mailOutline } from "ionicons/icons";
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
import { EventAgeHistogramComponent } from "../event-age-histogram/event-age-histogram.component";
import { EventAttendeesListComponent } from "../event-attendees-list/event-attendees-list.component";
import { EventBirthdayListComponent } from "../event-birthday-list/event-birthday-list.component";

const LEADER_ROLES: SDK.MemberRolesEnum[] = [SDK.MemberRolesEnum.Instruktor, SDK.MemberRolesEnum.Vedouci];

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
		IonButton,
		IonIcon,
		TooltipDirective,
		EventAttendeesListComponent,
		AddButtonComponent,
		EventAgeHistogramComponent,
		EventBirthdayListComponent,
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

	canAddLeader = computed(() => this.event()?._links?.addEventLeader?.allowed ?? false);
	canAddAttendee = computed(() => this.event()?._links?.addEventAttendee?.allowed ?? false);

	attendeesCount = computed(() => {
		const attendees = this.attendees();
		const leaders = this.leaders();
		if (attendees === undefined || leaders === undefined) return undefined;
		return attendees.length + leaders.length;
	});

	allMembers = computed(() =>
		[...(this.leaders() ?? []), ...(this.attendees() ?? [])]
			.map((a) => a.member)
			.filter((m): m is SDK.MemberResponse => !!m),
	);

	birthdays = computed(() => {
		const event = this.event();
		if (!event) return [];

		return getBirthdaysBetween(this.allMembers(), event.dateFrom, event.dateTill);
	});

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

	actions: Action[] = [];

	modal?: HTMLIonModalElement;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		addIcons({ mailOutline });

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

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

		attendees.sort((a, b) => {
			if (!a.member || !b.member) return 0;

			const aString = [a.member.nickname, a.member.firstName, a.member.lastName].join(" ");
			const bString = [b.member.nickname, b.member.firstName, b.member.lastName].join(" ");

			return b.member.role.localeCompare(a.member.role) || aString.localeCompare(bString);
		});

		this.attendees.set(attendees.filter((a) => a.type === "attendee"));
		this.leaders.set(attendees.filter((a) => a.type === "leader"));
	}

	private emailsOf(attendees?: SDK.EventAttendeeResponseWithLinks[]) {
		return [...new Set((attendees ?? []).flatMap((attendee) => getMemberEmails(attendee.member)))];
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

	async addAttendee(type: SDK.EventAttendeeCreateBodyTypeEnum) {
		const event = this.event();
		if (!event) return;

		const selectedAttendees = computed(() => (type === "leader" ? this.leaders() : this.attendees()) ?? []);
		const selectedIds = computed(() => selectedAttendees().map((attendee) => attendee.memberId));

		const addSelectedMember = async (member: SDK.MemberResponse) => {
			const existing = this.findAttendee(member.id);

			if (type !== "leader" && existing?.type === "leader") {
				const confirmation = await this.confirmLeaderDemotion(member);
				if (!confirmation) return;
			}

			try {
				if (type === "leader") {
					await this.api.EventsApi.addEventLeader(event.id, member.id);
				} else if (existing) {
					await this.api.EventsApi.updateEventAttendee(event.id, member.id, { type });
				} else {
					await this.api.EventsApi.addEventAttendee(event.id, member.id, { type });
				}
			} catch (e) {
				this.toastService.toast(
					type === "leader" ? "Nepodařilo se přidat vedoucího." : "Nepodařilo se přidat účastníka.",
					{ color: "danger" },
				);
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

			if (attendee.type === "leader") {
				const confirmation = await this.confirmLeaderRemoval(member);
				if (!confirmation) return;
			}

			try {
				await this.api.EventsApi.deleteEventAttendee(event.id, member.id);
			} catch (e) {
				this.toastService.toast(
					type === "leader" ? "Nepodařilo se odebrat vedoucího." : "Nepodařilo se odebrat účastníka.",
					{ color: "danger" },
				);
				return;
			}

			await this.loadAttendees(event);

			this.change.emit();
		};

		const clearAllMembers = async () => {
			const removable = (selectedAttendees() ?? []).filter(
				(attendee) => attendee._links.deleteEventAttendee.allowed,
			);
			if (!removable.length) return;

			const confirmation = await this.modalService.deleteConfirmationModal(
				type === "leader"
					? "Opravdu chcete odebrat všechny vedoucí akce?"
					: "Opravdu chcete odebrat všechny účastníky akce?",
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
				roles: type === "leader" ? LEADER_ROLES : undefined,
				title: type === "leader" ? "Přidat vedoucí" : "Přidat účastníky",
				subtitle:
					type === "leader"
						? "Vyber vedoucí a instruktory ze svého oddílu."
						: "Vyber účastníky ze svého oddílu.",
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

	async removeAttendee(attendee: SDK.EventAttendeeResponseWithLinks) {
		const event = this.event();
		if (!event) return;

		if (attendee.type === "leader") {
			const confirmation = await this.confirmLeaderRemoval(attendee.member);
			if (!confirmation) return;
		}

		try {
			this.attendees.set(this.attendees()?.filter((item) => item.memberId !== attendee.memberId));

			await this.api.EventsApi.deleteEventAttendee(event.id, attendee.memberId);

			if (attendee.type === "leader") this.toastService.toast("Vedoucí odebrán.");
			else this.toastService.toast("Účastník odebrán.");

			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat účastníka.");
			this.attendees.set([...(this.attendees() ?? []), attendee]);
		}
	}

	toggleSliding(sliding: any) {
		sliding.getOpenAmount().then((open: number) => {
			if (open) sliding.close();
			else sliding.open();
		});
	}

	async getAnnouncement(event: SDK.EventResponseWithLinks) {
		if (!event) return;

		try {
			const res = (await this.api.EventsApi.getEventAnnouncement(event.id, { responseType: "blob" })) as any;

			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const fileName = res.headers["content-disposition"]?.match(/filename="?([^";]+)"?/)?.[1] ?? "ohlaska.xlsx";

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			this.toastService.toast("Nepodařilo se stáhnout ohlášku.", { color: "danger" });
		}
	}
}
