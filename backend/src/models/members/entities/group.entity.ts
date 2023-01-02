import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("groups")
export class Group {
  @PrimaryColumn() id!: string;

  @Column({ type: "boolean", nullable: false, default: true }) active!: boolean;

  @Column({ type: "text", nullable: true }) name!: string | null;
}
