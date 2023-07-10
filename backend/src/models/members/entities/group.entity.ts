import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("groups")
export class Group {
  @PrimaryGeneratedColumn() id!: number;

  @Column({ type: "text", nullable: true }) name!: string | null;
  @Column({ type: "varchar", nullable: false, default: "XX" }) shortName!: string;
  @Column({ type: "boolean", nullable: false, default: true }) active!: boolean;

  @DeleteDateColumn() deletedAt!: string | null;
}
