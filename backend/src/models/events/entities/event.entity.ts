import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn()
  id: number;
}
