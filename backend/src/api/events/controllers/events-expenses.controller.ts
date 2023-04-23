import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { EventsService } from "src/models/events/services/events.service";
import {
  EventExpenseCreateRoute,
  EventExpenseDeleteRoute,
  EventExpenseEditRoute,
  EventExpensesListRoute,
} from "../acl/event-expense.acl";
import { EventExpenseCreateBody, EventExpenseResponse, EventExpenseUpdateBody } from "../dto/event-expense.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsExpensesController {
  constructor(private events: EventsService) {}

  @Get(":eventId/attendees")
  @AcLinks(EventExpensesListRoute)
  @ApiResponse({ type: EventExpenseResponse })
  async listEventExpenses(@Req() req: Request, @Param("eventId") eventId: number): Promise<EventExpenseResponse[]> {
    const event = await this.events.getEvent(eventId);
    if (!event) throw new NotFoundException();

    EventExpensesListRoute.canOrThrow(req, event);

    return this.events.getEventExpenses(eventId);
  }

  @Post(":eventId/attendees/:expenseId")
  @AcLinks(EventExpenseCreateRoute)
  @ApiResponse({ status: 204 })
  async addEventExpense(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("expenseId") expenseId: string,
    @Body() body: EventExpenseCreateBody,
  ) {
    const event = await this.events.getEvent(eventId);
    if (!event) throw new NotFoundException();

    EventExpenseCreateRoute.canOrThrow(req, event);

    await this.events.createEventExpense(eventId, expenseId, body);
  }

  @Patch(":eventId/attendees/:expenseId")
  @AcLinks(EventExpenseEditRoute)
  @ApiResponse({ status: 204 })
  async updateEventExpense(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("expenseId") expenseId: string,
    @Body() body: EventExpenseUpdateBody,
  ) {
    const eventExpense = await this.events.getEventExpense(eventId, expenseId);
    if (!eventExpense) throw new NotFoundException();

    EventExpenseEditRoute.canOrThrow(req, eventExpense);

    eventExpense.type = body.type;

    await this.events.updateEventExpense(eventId, expenseId, body);
  }

  @Delete(":eventId/attendees/:expenseId")
  @AcLinks(EventExpenseDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteEventExpense(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("expenseId") expenseId: string,
  ) {
    const eventExpense = await this.events.getEventExpense(eventId, expenseId);
    if (!eventExpense) throw new NotFoundException();

    EventExpenseDeleteRoute.canOrThrow(req, eventExpense);

    await this.events.deleteEventExpense(eventId, expenseId);
  }
}
