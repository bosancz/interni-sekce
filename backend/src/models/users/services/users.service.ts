import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async listUsers() {
    return this.userRepository.find({ relations: ["member", "member.group"] });
  }

  async createUser(data: Partial<User>) {
    return this.userRepository.save(data);
  }

  async getUser(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async findUser(where: FindOptionsWhere<User> | FindOptionsWhere<User>[], options: { credentials?: boolean } = {}) {
    return this.userRepository.findOne({
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
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: number) {
    return this.userRepository.delete(id);
  }
}
