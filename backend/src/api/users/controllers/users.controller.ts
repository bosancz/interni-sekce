import {
	Body,
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
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { HashService } from "src/auth/services/hash.service";
import { TokenService } from "src/auth/services/token.service";
import { toPrefixTsQuery } from "src/helpers/search";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { User } from "src/models/users/entities/user.entity";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { Repository } from "typeorm";
import {
	UserCreatePermission,
	UserDeletePermission,
	UserEditPermission,
	UserImpersonatePermission,
	UserReadPermission,
	UserSetPassword,
	UsersListPermission,
} from "../acl/user.acl";
import { UserCreateBody } from "../dto/user-create-body";
import { UserSetPasswordBody } from "../dto/user-set-password-body";
import { UserUpdateBody } from "../dto/user-update-body";
import { GetUserQueryDto, UserResponse } from "../dto/user.dto";
import { ListUsersQuery } from "../dto/users.dto";

@Controller("users")
@Authenticated()
@AcController()
@ApiTags("Users")
export class UsersController {
	private logger = new Logger(UsersController.name);

	constructor(
		private userService: UsersRepository,
		private tokenService: TokenService,
		private hashService: HashService,
		private notifications: NotificationsService,
		@InjectRepository(User) private userRepository: Repository<User>,
	) {}

	@Get()
	@AcLinks(UsersListPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse), isArray: true })
	async listUsers(@Req() req: Request, @Query() query: ListUsersQuery): Promise<UserResponse[]> {
		const q = this.userRepository
			.createQueryBuilder("user")
			.select([
				"user.id",
				"user.login",
				"user.memberId",
				"user.roles",
				"user.email",
				"member.nickname",
				"member.firstName",
				"member.lastName",
			])
			.leftJoin("user.member", "member")
			.where(UsersListPermission.canWhere(req, "user"))
			.orderBy("user.login", "ASC")
			.take(query.limit || 25)
			.skip(query.offset || 0);

		if (query.search) {
			const search = toPrefixTsQuery(query.search);
			if (search)
				q.andWhere(
					"user.searchVector @@ to_tsquery('simple_unaccent', :search) OR member.searchVector @@ to_tsquery('simple_unaccent', :search)",
					{ search },
				);
		}

		if (query.roles) q.andWhere("user.roles && array[:...roles]::users_roles_enum[]", { roles: query.roles });

		return q.getMany();
	}

	@Post()
	@AcLinks(UserCreatePermission)
	@ApiResponse({ type: WithLinks(UserResponse) })
	async createUser(@Req() req: Request, @Body() body: UserCreateBody): Promise<UserResponse> {
		UserCreatePermission.canOrThrow(req);

		const user = await this.userService.createUser(body);

		this.notifications
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
		const user = await this.userRepository.findOne({
			where: { id: userId },
			relations: query.includeMember ? { member: { group: true } } : {},
		});
		if (!user) throw new NotFoundException();

		UserReadPermission.canOrThrow(req, user);

		return user;
	}

	@Patch(":userId")
	@AcLinks(UserEditPermission)
	@ApiResponse({ status: 204 })
	async updateUser(@Req() req: Request, @Param("userId", ParseIntPipe) userId: number, @Body() body: UserUpdateBody): Promise<void> {
		const user = await this.userService.getUser(userId);
		if (!user) throw new NotFoundException();

		UserEditPermission.canOrThrow(req, user);

		await this.userService.updateUser(userId, body);
	}

	@Delete(":userId")
	@AcLinks(UserDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteUser(@Req() req: Request, @Param("userId", ParseIntPipe) userId: number): Promise<void> {
		const user = await this.userService.getUser(userId);
		if (!user) throw new NotFoundException();

		UserDeletePermission.canOrThrow(req, user);

		await this.userService.deleteUser(userId);
	}

	@Put(":userId/password")
	@AcLinks(UserSetPassword)
	@ApiResponse({ status: 204 })
	async setUserPassword(
		@Req() req: Request,
		@Param("userId", ParseIntPipe) userId: number,
		@Body() body: UserSetPasswordBody,
	): Promise<void> {
		const user = await this.userService.getUser(userId);
		if (!user) throw new NotFoundException();

		UserSetPassword.canOrThrow(req, user);

		// the password column stores a bcrypt hash, never the plaintext
		const password = await this.hashService.generateHash(body.password);
		await this.userService.updateUser(userId, { password });
	}

	@Post(":userId/impersonate")
	@AcLinks(UserImpersonatePermission)
	async impersonateUser(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Param("userId", ParseIntPipe) userId: number,
	) {
		const user = await this.userService.getUser(userId);
		if (!user) throw new NotFoundException();

		UserImpersonatePermission.canOrThrow(req, user);

		// replaces the caller's token cookie, remembering who they really are so logging out
		// returns to that account; chained impersonations keep pointing at the original user
		const impersonatorId = req.user!.impersonatorId ?? req.user!.userId;

		await this.tokenService.setToken(res, user.id, impersonatorId !== user.id ? impersonatorId : undefined);
	}
}
