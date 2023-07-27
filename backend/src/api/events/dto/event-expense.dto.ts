import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { EventExpense, EventExpenseTypes } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventResponse } from "./event.dto";

export class EventExpenseResponse implements EventExpense {
  @ApiProperty() id!: string;
  @ApiProperty() eventId!: number;
  @ApiPropertyOptional({ type: "number" }) amount!: number | null;
  @ApiPropertyOptional({ enum: EventExpenseTypes, enumName: "EventExpenseTypesEnum" }) type!: EventExpenseTypes | null;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;

  @ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;
}

export class EventExpenseCreateBody {
  @IsEnum(EventExpenseTypes) type!: EventExpenseTypes;
  @IsNumber() amount!: number | null;
  @IsString() description!: string | null;
}

export class EventExpenseUpdateBody extends EventExpenseCreateBody {}
