import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("groups")
export class Group {
  @PrimaryGeneratedColumn()
  id!: string;
}
