import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class UsersRepository {
	constructor(@InjectRepository(User) private repository: Repository<User>) {}

	async listUsers() {
		return this.repository.find({ relations: ["member", "member.group"] });
	}

	async createUser(data: Partial<User>) {
		return this.repository.save(data);
	}

	async getUser(id: number, options: { includeMember?: boolean } = {}) {
		return this.repository.findOne({
			where: { id },
			relations: options.includeMember ? ["member", "member.group"] : [],
		});
	}

	async findUser(where: FindOptionsWhere<User> | FindOptionsWhere<User>[], options: { credentials?: boolean } = {}) {
		return this.repository.findOne({
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
					}
				: undefined,
			where,
		});
	}

	async updateUser(id: number, data: Partial<User>) {
		return this.repository.update(id, data);
	}

	async deleteUser(id: number) {
		return this.repository.delete(id);
	}
}
