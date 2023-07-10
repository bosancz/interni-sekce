import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";

@Injectable()
export class PaddlersStatisticsService {
  constructor(
    @InjectRepository(Member) private membersRepository: Repository<Member>,
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
  ) {}

  async getPaddlersRanking(year: number) {
    return this.membersRepository
      .createQueryBuilder("m")
      .select("m.id,m.nickname,m.first_name,m.last_name,g.id as group_id, km.water_km")
      .leftJoin(
        (qb) =>
          qb
            .select("ea.member_id,SUM(events.water_km) as water_km")
            .from(EventAttendee, "ea")
            .leftJoin("ea.event", "e")
            .where("EXTRACT(YEAR FROM e.dateFrom) = :year", { year })
            .groupBy("member_id"),
        "km",
        "m.id = km.member_id",
      )
      .leftJoin("m.group", "g")

      .getRawMany<{
        id: number;
        nickname: string;
        firstName: string;
        lastName: string;
        groupId: number;
        waterKm: number;
      }>();
  }

  async getPaddlersTotals() {
    const years = await this.eventsRepository
      .createQueryBuilder("e")
      .select("DISTINCT EXTRACT(YEAR FROM e.dateFrom) as year")
      .getRawMany<{ year: number }>()
      .then((rows) => rows.map((r) => r.year));

    return { years };
  }
}
