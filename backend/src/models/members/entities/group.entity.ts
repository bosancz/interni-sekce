import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("groups")
export class Group {
  @PrimaryGeneratedColumn() id!: number;

  @Column({ type: "text", nullable: true }) name!: string | null;
  @Column({ type: "varchar", nullable: false }) shortName!: string;
  @Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
  @Column({ type: "varchar", nullable: true }) color!: string | null;
  @Column({ type: "varchar", nullable: true }) darkColor!: string | null;

  @DeleteDateColumn() deletedAt!: string | null;
}
