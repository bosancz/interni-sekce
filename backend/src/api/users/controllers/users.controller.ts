import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Put,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { HashService } from "src/auth/services/hash.service";
import { TokenService } from "src/auth/services/token.service";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import {
	UserCreatePermission,
	UserDeletePermanentPermission,
	UserDeletePermission,
	UserEditPermission,
	UserImpersonatePermission,
	UserReadPermission,
	UserRestorePermission,
	UserSetPassword,
	UsersDeletedListPermission,
	UsersListPermission,
} from "../acl/user.acl";
import { UserCreateBody } from "../dto/user-create-body";
import { UserSetPasswordBody } from "../dto/user-set-password-body";
import { UserUpdateBody } from "../dto/user-update-body";
import { GetUserQueryDto, UserResponse } from "../dto/user.dto";
import { ListUsersQuery } from "../dto/users.dto";

function isDuplicateError(err: unknown): err is QueryFailedError {
	return err instanceof QueryFailedError && (err.driverError as { code?: string }).code === "23505";
}

function duplicateUserMessage(err: QueryFailedError) {
	const detail = (err.driverError as { detail?: string }).detail ?? "";
	if (detail.includes("(email)")) return "Tenhle e-mail už má jiný uživatel.";
	if (detail.includes("(member_id)")) return "Tenhle člen už má jiný uživatelský účet.";
	return "Tenhle login už má jiný uživatel.";
}

@Controller("users")
@Authenticated()
@AcController()
@ApiTags("Users")
export class UsersController {
	private logger = new Logger(UsersController.name);

	constructor(
		private usersRepository: UsersRepository,
		private tokenService: TokenService,
		private hashService: HashService,
		private notificationsService: NotificationsService,
	) {}

	@Get()
	@AcLinks(UsersListPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse), isArray: true })
	async listUsers(@Req() req: Request, @Query() query: ListUsersQuery): Promise<UserResponse[]> {
		return this.usersRepository.listUsers({
			where: (alias) => UsersListPermission.canWhere(req, alias),
			search: query.search,
			roles: query.roles,
			limit: query.limit,
			offset: query.offset,
			sort: query.sort,
			order: query.order,
		});
	}

	@Get("deleted")
	@AcLinks(UsersDeletedListPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse), isArray: true })
	async listDeletedUsers(@Req() req: Request): Promise<UserResponse[]> {
		UsersDeletedListPermission.canOrThrow(req);

		return this.usersRepository.getDeletedUsers((alias) => UsersDeletedListPermission.canWhere(req, alias));
	}

	@Post()
	@AcLinks(UserCreatePermission)
	@ApiResponse({ type: WithLinks(UserResponse) })
	async createUser(@Req() req: Request, @Body() body: UserCreateBody): Promise<UserResponse> {
		UserCreatePermission.canOrThrow(req);

		const user = await this.usersRepository.createUser(body).catch((err) => this.throwOnDuplicateUser(err, body));

		this.notificationsService
			.onUserCreated(user, req.user?.userId)
			.catch((err) => this.logger.error(`Failed to send user created notifications: ${err.message}`));

		return user;
	}

	@Get(":userId")
	@AcLinks(UserReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse) })
	async getUser(
		@Req() req: Request,
		@Param("userId", ParseIntPipe) userId: number,
		@Query() query: GetUserQueryDto,
	): Promise<UserResponse> {
		const user = await this.usersRepository.getUser(userId, { includeMember: query.includeMember });
		if (!user) throw new NotFoundException();

		UserReadPermission.canOrThrow(req, user);

		return user;
	}

	@Patch(":userId")
	@AcLinks(UserEditPermission)
	@ApiResponse({ status: 204 })
	async updateUser(
		@Req() req: Request,
		@Param("userId", ParseIntPipe) userId: number,
		@Body() body: UserUpdateBody,
	): Promise<void> {
		const user = await this.usersRepository.getUser(userId);
		if (!user) throw new NotFoundException();

		UserEditPermission.canOrThrow(req, user);

		await this.usersRepository.updateUser(userId, body).catch((err) => this.throwOnDuplicateUser(err, body));
	}

	@Delete(":userId")
	@AcLinks(UserDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteUser(@Req() req: Request, @Param("userId", ParseIntPipe) userId: number): Promise<void> {
		const user = await this.usersRepository.getUser(userId);
		if (!user) throw new NotFoundException();

		UserDeletePermission.canOrThrow(req, user);

		await this.usersRepository.deleteUser(userId, req.user?.userId ?? null);
	}

	@Post(":userId/restore")
	@AcLinks(UserRestorePermission)
	@ApiResponse({ status: 204 })
	async restoreUser(@Req() req: Request, @Param("userId", ParseIntPipe) userId: number): Promise<void> {
		const user = await this.usersRepository.getDeletedUser(userId);
		if (!user) throw new NotFoundException();

		UserRestorePermission.canOrThrow(req, user);

		await this.usersRepository.restoreUser(userId).catch((err) => this.throwOnDuplicateUser(err, {}));
	}

	@Delete(":userId/permanent")
	@AcLinks(UserDeletePermanentPermission)
	@ApiResponse({ status: 204 })
	async deleteUserPermanent(@Req() req: Request, @Param("userId", ParseIntPipe) userId: number): Promise<void> {
		const user = await this.usersRepository.getDeletedUser(userId);
		if (!user) throw new NotFoundException();

		UserDeletePermanentPermission.canOrThrow(req, user);

		await this.usersRepository.hardDeleteUser(userId);
	}

	private async throwOnDuplicateUser(
		err: unknown,
		data: { login?: string; email?: string | null; memberId?: number | null },
	): Promise<never> {
		if (!isDuplicateError(err)) throw err;

		const deleted = await this.usersRepository.findDeletedUserConflict(data);
		if (deleted)
			throw new ConflictException(
				`Login, e-mail nebo člena drží smazaný uživatel ${deleted.login}. Obnov ho, nebo ho trvale smaž ve Smazaných uživatelích.`,
			);

		throw new ConflictException(duplicateUserMessage(err));
	}

	@Put(":userId/password")
	@AcLinks(UserSetPassword)
	@ApiResponse({ status: 204 })
	async setUserPassword(
		@Req() req: Request,
		@Param("userId", ParseIntPipe) userId: number,
		@Body() body: UserSetPasswordBody,
	): Promise<void> {
		const user = await this.usersRepository.getUser(userId);
		if (!user) throw new NotFoundException();

		UserSetPassword.canOrThrow(req, user);

		const password = await this.hashService.generateHash(body.password);
		await this.usersRepository.updateUser(userId, { password });
	}

	@Post(":userId/impersonate")
	@AcLinks(UserImpersonatePermission)
	async impersonateUser(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Param("userId", ParseIntPipe) userId: number,
	) {
		const user = await this.usersRepository.getUser(userId);
		if (!user) throw new NotFoundException();

		UserImpersonatePermission.canOrThrow(req, user);

		const impersonatorId = req.user!.impersonatorId ?? req.user!.userId;

		await this.tokenService.setToken(res, user.id, impersonatorId !== user.id ? impersonatorId : undefined);
	}
}
