import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Group } from "./group.entity";
import { MemberAchievement } from "./member-achievements.entity";
import { MemberContact } from "./member-contacts.entity";

export enum MemberRole {
  "dite" = "dite",
  "instruktor" = "instruktor",
  "vedouci" = "vedouci",
}

// FIXME:
export enum MemberRank {
  "dite" = "dite",
  "instruktor" = "instruktor",
  "vedouci" = "vedouci",
}

export enum MembershipStatus {
  "clen" = "clen",
  "neclen" = "neclen",
  "pozastaveno" = "pozastaveno",
}

@Entity("members")
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false }) groupId!: Group["id"];
  @Column({ type: "varchar", nullable: false }) nickname!: string;
  @Column({ type: "enum", enum: MemberRole, nullable: false }) role!: MemberRole;

  @Column({ type: "enum", enum: MemberRank, nullable: true }) rank!: MemberRank | null;
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

  @DeleteDateColumn() deletedAt?: Date;

  @ManyToOne(() => Group, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group?: Group;

  @OneToMany(() => MemberContact, (mb) => mb.member)
  contacts?: MemberContact[];

  @OneToMany(() => MemberAchievement, (mb) => mb.member)
  achievements?: MemberAchievement[];

  @Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
  @Column({ type: "enum", enum: MembershipStatus, nullable: false, default: MembershipStatus.clen })
  membership!: MembershipStatus;

  @OneToMany(() => EventAttendee, (ea) => ea.member)
  eventAttendees?: EventAttendee[];
}
