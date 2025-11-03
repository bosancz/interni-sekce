import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { EventExpense, EventExpenseTypes } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventResponse } from "./event.dto";

export class EventExpenseResponse implements EventExpense {
	@ApiProperty() id!: number;
	@ApiProperty() eventId!: number;
	@ApiProperty() receiptNumber?: string;
	@ApiProperty({ type: "number" }) amount?: number;
	@ApiProperty({ enum: EventExpenseTypes, enumName: "EventExpenseTypesEnum" }) type?: EventExpenseTypes;
	@ApiProperty({ type: "string" }) description?: string;

	@ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;
}

export class EventExpenseCreateBody {
	@IsString() @IsOptional() receiptNumber?: string;
	@IsEnum(EventExpenseTypes) @IsOptional() type?: EventExpenseTypes;
	@IsNumber() @IsOptional() amount?: number;
	@IsString() @IsOptional() description?: string;
}

export class EventExpenseUpdateBody extends EventExpenseCreateBody {}
