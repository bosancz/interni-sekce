import { ApiProperty } from "@nestjs/swagger";
import { EventAnnouncementMissingData } from "src/models/events/services/event-announcement.service";

export class EventAnnouncementMissingDataResponse implements EventAnnouncementMissingData {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty({ type: String, isArray: true }) fields!: string[];
}

export class EventAnnouncementCheckResponse {
	@ApiProperty() recipient!: string;
	@ApiProperty({ type: EventAnnouncementMissingDataResponse, isArray: true })
	missing!: EventAnnouncementMissingDataResponse[];
}

export class EventAnnouncementSendResponse {
	@ApiProperty() recipient!: string;
	@ApiProperty({ type: "string", format: "date-time" }) sentAt!: Date;
}
