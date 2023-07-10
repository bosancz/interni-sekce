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

  async findUser(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
    return this.userRepository.findOneBy(where);
  }

  async updateUser(id: number, data: Partial<User>) {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: number) {
    return this.userRepository.delete(id);
  }
}
