import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
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
@AcController()
@ApiTags("Users")
export class UsersController {
	constructor(
		private userService: UsersRepository,
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
			.where(UsersListPermission.canWhere(req))
			.orderBy("user.login", "ASC")
			.take(query.limit || 25)
			.skip(query.offset || 0);

		if (query.search)
			q.andWhere("user.login ILIKE :search OR member.nickname ILIKE :search", { search: `%${query.search}%` });

		if (query.roles) q.andWhere("user.roles && array[:...roles]::users_roles_enum[]", { roles: query.roles });

		return q.getMany();
	}

	@Post()
	@AcLinks(UserCreatePermission)
	@ApiResponse({ type: WithLinks(UserResponse) })
	async createUser(@Req() req: Request, @Body() body: UserCreateBody): Promise<UserResponse> {
		UserCreatePermission.canOrThrow(req);

		return this.userService.createUser(body);
	}

	@Get(":id")
	@AcLinks(UserReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse) })
	async getUser(
		@Req() req: Request,
		@Param("id") id: number,
		@Query() query: GetUserQueryDto,
	): Promise<UserResponse> {
		const user = await this.userRepository.findOne({
			where: { id },
			relations: query.includeMember ? ["member", "member.group"] : [],
		});
		if (!user) throw new NotFoundException();

		UserReadPermission.canOrThrow(req, user);

		return user;
	}

	@Patch(":id")
	@AcLinks(UserEditPermission)
	@ApiResponse({ status: 204 })
	async updateUser(@Req() req: Request, @Param("id") id: number, @Body() body: UserUpdateBody): Promise<void> {
		const user = await this.userService.getUser(id);
		if (!user) throw new NotFoundException();

		UserEditPermission.canOrThrow(req, user);

		await this.userService.updateUser(id, body);
	}

	@Delete(":id")
	@AcLinks(UserDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteUser(@Req() req: Request, @Param("id") id: number): Promise<void> {
		const user = await this.userService.getUser(id);
		if (!user) throw new NotFoundException();

		UserDeletePermission.canOrThrow(req, user);

		await this.userService.deleteUser(id);
	}

	@Put(":id/password")
	@AcLinks(UserSetPassword)
	@ApiResponse({ status: 204 })
	async setUserPassword(
		@Req() req: Request,
		@Param("id") id: number,
		@Body() body: UserSetPasswordBody,
	): Promise<void> {
		const user = await this.userService.getUser(id);
		if (!user) throw new NotFoundException();

		UserSetPassword.canOrThrow(req, user);

		await this.userService.updateUser(id, body);
	}

	@Post(":id/impersonate")
	@AcLinks(UserImpersonatePermission)
	async impersonateUser(@Req() req: Request, @Param("id") id: number) {
		const user = await this.userService.getUser(id);
		if (!user) throw new NotFoundException();

		UserImpersonatePermission.canOrThrow(req, user);

		//TODO: implement
	}
}
