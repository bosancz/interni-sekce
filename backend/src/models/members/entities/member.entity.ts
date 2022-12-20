import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Group } from "./group.entity";
import { MemberAchievement } from "./member-achievements.entity";
import { MemberContact } from "./member-contacts.entity";

export enum MemberRole {
  "clen" = "clen",
  "vedouci" = "vedouci",
}

export enum MemberRank {
  "dite" = "dite",
  "instruktor" = "instruktor",
  "vedouci" = "vedouci",
}

@Entity("members")
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  groupId!: number;

  @ManyToOne(() => Group, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group?: Group;

  @OneToMany(() => MemberContact, (mb) => mb.member)
  contacts?: MemberContact[];

  @OneToMany(() => MemberAchievement, (mb) => mb.member)
  achievements?: MemberAchievement[];

  @Column({ type: "boolean", nullable: false, default: false }) inactive!: boolean | null;
  @Column({ type: "boolean", nullable: false, default: true }) membership!: boolean | null;

  @Column({ type: "varchar", nullable: true }) role!: string | null;
  @Column({ type: "varchar", nullable: true }) rank!: string | null;
  @Column({ type: "varchar", nullable: true }) nickname!: string | null;
  @Column({ type: "varchar", nullable: true }) function!: string | null;
  @Column({ type: "varchar", nullable: true }) firstName!: string | null;
  @Column({ type: "varchar", nullable: true }) lastName!: string | null;
  @Column({ type: "date", nullable: true }) birthday!: string | null;
  @Column({ type: "varchar", nullable: true }) addressStreet!: string | null;
  @Column({ type: "varchar", nullable: true }) addressStreetNo!: string | null;
  @Column({ type: "varchar", nullable: true }) addressCity!: string | null;
  @Column({ type: "varchar", nullable: true }) addressPostalCode!: string | null;
  @Column({ type: "varchar", nullable: true }) addressCountry!: string | null;
  @Column({ type: "varchar", nullable: true }) mobile!: string | null;
  @Column({ type: "varchar", nullable: true }) email!: string | null;
}
