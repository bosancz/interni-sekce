import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Event } from "src/models/events/entities/event.entity";
import { Repository } from "typeorm";
import { getEventYearRange, getTotalChildDays } from "../statistics.helpers";

export interface ChildDaysStatistics {
	year: number;
	childDays: number;
	firstYear: number;
	lastYear: number;
}

@Injectable()
export class ChildDaysStatisticsService {
	constructor(@InjectRepository(Event) private eventsRepository: Repository<Event>) {}

	async getChildDaysStatistics(year: number): Promise<ChildDaysStatistics> {
		const [childDays, { firstYear, lastYear }] = await Promise.all([
			getTotalChildDays(this.eventsRepository, year),
			getEventYearRange(this.eventsRepository),
		]);

		return { year, childDays, firstYear, lastYear };
	}
}
