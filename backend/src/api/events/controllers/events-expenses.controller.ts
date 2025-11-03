import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import {
	EventExpenseCreatePermission,
	EventExpenseDeletePermission,
	EventExpenseEditPermission,
	EventExpensesListPermission,
} from "../acl/events.acl";
import { EventExpenseCreateBody, EventExpenseResponse, EventExpenseUpdateBody } from "../dto/event-expense.dto";

@Controller("events/:eventId/expenses")
@AcController()
@ApiTags("Events")
export class EventsExpensesController {
	constructor(private events: EventsRepository) {}

	@Get("")
	@AcLinks(EventExpensesListPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventExpenseResponse), isArray: true })
	async listEventExpenses(@Req() req: Request, @Param("eventId") eventId: number): Promise<EventExpenseResponse[]> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventExpensesListPermission.canOrThrow(req, event);

		const expenses = await this.events.getEventExpenses(eventId);

		return expenses;
	}

	@Post("")
	@HttpCode(201)
	@AcLinks(EventExpenseCreatePermission)
	@ApiResponse({ status: 201, type: WithLinks(EventExpenseResponse) })
	async addEventExpense(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Body() body: EventExpenseCreateBody,
	) {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventExpenseCreatePermission.canOrThrow(req, event);

		return await this.events.createEventExpense(eventId, body);
	}

	@Patch(":expenseId")
	@AcLinks(EventExpenseEditPermission)
	@ApiResponse({ status: 204 })
	async updateEventExpense(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Param("expenseId") expenseId: number,
		@Body() body: EventExpenseUpdateBody,
	) {
		const eventExpense = await this.events.getEventExpense(eventId, expenseId);
		if (!eventExpense) throw new NotFoundException();

		EventExpenseEditPermission.canOrThrow(req, eventExpense);

		eventExpense.type = body.type;

		await this.events.updateEventExpense(eventId, expenseId, body);
	}

	@Delete(":expenseId")
	@AcLinks(EventExpenseDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteEventExpense(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Param("expenseId") expenseId: number,
	) {
		const eventExpense = await this.events.getEventExpense(eventId, expenseId);
		if (!eventExpense) throw new NotFoundException();

		EventExpenseDeletePermission.canOrThrow(req, eventExpense);

		await this.events.deleteEventExpense(eventId, expenseId);
	}
}
