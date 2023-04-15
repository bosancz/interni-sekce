import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventResponse } from "./event.dto";

export class EventExpenseResponse implements EventExpense {
  @ApiProperty() id!: string;
  @ApiProperty() eventId!: number;
  @ApiPropertyOptional() amount!: number | null;
  @ApiPropertyOptional() type!: string | null;
  @ApiPropertyOptional() description!: string | null;

  @ApiPropertyOptional({ type: EventResponse }) event?: EventResponse | undefined;
}
