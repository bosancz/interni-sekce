import { Injectable } from "@nestjs/common";
import { Response } from "express";
import ical, { ICalCalendarMethod, ICalEventStatus, ICalEventTransparency } from "ical-generator";
import { DateTime } from "luxon";
import { Config } from "src/config";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";

@Injectable()
export class ProgramIcalService {
	constructor(
		private readonly config: Config,
		private readonly events: EventsRepository,
	) {}

	get feedUrl() {
		return `${this.config.app.baseUrl}/api/public/program/ical`;
	}

	async sendProgramIcal(res: Response): Promise<void> {
		res.setHeader("Content-Type", "text/calendar; charset=utf-8");
		res.setHeader("Content-Disposition", 'inline; filename="bosan-program.ics"');
		res.setHeader("Cache-Control", `public, max-age=${this.config.ical.ttlSeconds}`);
		res.send(await this.getProgramIcal());
	}

	async getProgramIcal(): Promise<string> {
		const events = await this.events.getPublicProgramIcal({ dateFrom: this.dateFrom() });

		const calendar = ical({
			name: this.config.ical.name,
			description: this.config.ical.description,
			prodId: { company: "bosan.cz", product: "interni-sekce", language: "CS" },
			method: ICalCalendarMethod.PUBLISH,
			url: this.feedUrl,
			ttl: this.config.ical.ttlSeconds,
		});

		for (const event of events) this.addEvent(calendar, event);

		return calendar.toString();
	}

	private addEvent(calendar: ReturnType<typeof ical>, event: Event) {
		const cancelled = event.status === EventStates.cancelled;

		calendar.createEvent({
			id: `event-${event.id}@bosan.cz`,
			start: this.date(event.dateFrom),
			end: this.date(event.dateTill).plus({ days: 1 }),
			allDay: true,
			summary: cancelled ? `Zrušeno: ${event.name}` : event.name,
			description: this.description(event) || null,
			location: event.place || null,
			url: event.hasRegistration
				? `${this.config.app.baseUrl}/api/public/program/${event.id}/registration`
				: null,
			organizer: { name: this.config.app.name, email: this.config.ical.organizer },
			status: cancelled ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED,
			transparency: ICalEventTransparency.TRANSPARENT,
		});
	}

	private description(event: Event): string {
		const groups = (event.groups ?? []).map((group) => group.shortName).filter(Boolean);
		const leaders = (event.leaders ?? []).map((leader) => leader.nickname).filter(Boolean);

		const meeting = [
			event.meetingPlaceStart ? `Sraz: ${event.meetingPlaceStart}` : null,
			event.meetingPlaceEnd ? `Konec: ${event.meetingPlaceEnd}` : null,
		].filter(Boolean);

		return [
			event.description?.trim() || null,
			meeting.length ? meeting.join(", ") : null,
			groups.length ? `Oddíly: ${groups.join(", ")}` : null,
			leaders.length ? `Vedoucí: ${leaders.join(", ")}` : null,
		]
			.filter(Boolean)
			.join("\n\n");
	}

	private date(date: string) {
		return DateTime.fromISO(date, { zone: this.config.ical.timezone });
	}

	private dateFrom() {
		return DateTime.now()
			.setZone(this.config.ical.timezone)
			.minus({ days: this.config.ical.daysBack })
			.toISODate()!;
	}
}
