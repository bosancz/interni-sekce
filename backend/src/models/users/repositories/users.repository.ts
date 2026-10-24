import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { toPrefixTsQuery } from "src/helpers/search";
import { Brackets, FindOptionsWhere, Repository } from "typeorm";
import { User, UserSettings } from "../entities/user.entity";
import { getSavedRoles, getUserRoles } from "../helpers/user-roles";
import { UserRoles, UserDynamicRoles } from "../schema/user-roles";

@Injectable()
export class UsersRepository {
	constructor(@InjectRepository(User) private repository: Repository<User>) {}

	async listUsers(options: {
		where?: (alias: string) => Brackets | string;
		search?: string;
		roles?: UserRoles[];
		limit?: number;
		offset?: number;
	}) {
		const q = this.repository
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
				"member.active",
			])
			.leftJoin("user.member", "member")
			.orderBy("user.login", "ASC")
			.take(options.limit || 25)
			.skip(options.offset || 0);

		if (options.where) q.andWhere(options.where("user"));

		if (options.search) {
			const search = toPrefixTsQuery(options.search);
			if (search)
				q.andWhere(
					"user.searchVector @@ to_tsquery('simple_unaccent', :search) OR member.searchVector @@ to_tsquery('simple_unaccent', :search)",
					{ search },
				);
		}

		if (options.roles?.length) {
			const roles = options.roles;
			const assignedRoles = getSavedRoles(roles);
			q.andWhere(
				new Brackets((qb) => {
					qb.where("false");
					if (assignedRoles.length)
						qb.orWhere("user.roles && array[:...assignedRoles]::users_roles_enum[]", { assignedRoles });
					if (roles.includes(UserDynamicRoles.vedouci)) qb.orWhere("member.active = true");
					if (roles.includes(UserDynamicRoles.uzivatel)) qb.orWhere("true");
				}),
			);
		}

		return (await q.getMany()).map((user) => this.withDynamicRoles(user));
	}

	async getUsers(options: { roles?: UserRoles[]; memberIds?: number[] } = {}) {
		const q = this.repository.createQueryBuilder("user").leftJoinAndSelect("user.member", "member");

		if (options.memberIds) {
			if (!options.memberIds.length) return [];
			q.where("user.memberId IN (:...memberIds)", { memberIds: options.memberIds });
		}

		const users = (await q.getMany()).map((user) => this.withDynamicRoles(user));
		const roles = options.roles;
		return roles ? users.filter((user) => roles.some((role) => user.roles?.includes(role))) : users;
	}

	async createUser(data: Partial<User>) {
		return this.repository.save(data);
	}

	async getUser(id: number, options: { includeMember?: boolean } = {}) {
		const user = await this.repository.findOne({
			where: { id },
			relations: { member: options.includeMember ? { group: true } : true },
		});
		if (!user) return null;
		this.withDynamicRoles(user);
		if (!options.includeMember) delete user.member;
		return user;
	}

	async getSessionUser(id: number) {
		const user = await this.repository.findOne({
			where: { id },
			select: { id: true, memberId: true, roles: true, member: { id: true, active: true, groupId: true } },
			relations: { member: true },
		});
		return user && this.withDynamicRoles(user);
	}

	async findUser(where: FindOptionsWhere<User> | FindOptionsWhere<User>[], options: { credentials?: boolean } = {}) {
		const user = await this.repository.findOne({
			select: options.credentials
				? {
						id: true,
						login: true,
						password: true,
						roles: true,
						loginCode: true,
						loginCodeExp: true,
						email: true,
						memberId: true,
						member: { id: true, active: true },
					}
				: undefined,
			relations: { member: true },
			where,
		});
		return user && this.withDynamicRoles(user);
	}

	async getUserSettings(id: number): Promise<UserSettings> {
		const user = await this.repository.findOne({ where: { id }, select: { id: true, settings: true } });
		return user?.settings ?? {};
	}

	async setUserSettings(id: number, settings: UserSettings) {
		return this.repository.update(id, { settings });
	}

	async updateUser(id: number, data: Partial<User>) {
		return this.repository.update(id, data);
	}

	async deleteUser(id: number) {
		return this.repository.delete(id);
	}

	private withDynamicRoles(user: User) {
		user.roles = getUserRoles(user.roles, user.member);
		return user;
	}
}
