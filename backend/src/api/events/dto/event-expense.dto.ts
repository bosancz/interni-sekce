import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { EventExpense, EventExpenseType } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventResponse } from "./event.dto";

export class EventExpenseResponse implements EventExpense {
  @ApiProperty() id!: string;
  @ApiProperty() eventId!: number;
  @ApiPropertyOptional({ type: "number" }) amount!: number | null;
  @ApiPropertyOptional({ enum: EventExpenseType }) type!: EventExpenseType | null;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;

  @ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;
}

export class EventExpenseCreateBody {
  @IsEnum(EventExpenseType) type!: EventExpenseType;
  @IsNumber() amount!: number | null;
  @IsString() description!: string | null;
}

export class EventExpenseUpdateBody extends EventExpenseCreateBody {}
