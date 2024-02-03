import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { User } from "src/models/users/entities/user.entity";
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Group } from "./group.entity";
import { MemberAchievement } from "./member-achievements.entity";
import { MemberContact } from "./member-contact.entity";

export enum MemberRoles {
  "dite" = "dite",
  "instruktor" = "instruktor",
  "vedouci" = "vedouci",
}

// FIXME:
export enum MemberRanks {
  "dite" = "dite",
  "instruktor" = "instruktor",
  "vedouci" = "vedouci",
}

export enum MembershipStates {
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
  @Column({ type: "enum", enum: MemberRoles, nullable: false }) role!: MemberRoles;
  @Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
  @Column({ type: "enum", enum: MembershipStates, nullable: false, default: MembershipStates.clen })
  membership!: MembershipStates;

  @Column({ type: "enum", enum: MemberRanks, nullable: true }) rank?: MemberRanks | null;
  @Column({ type: "varchar", nullable: true }) function?: string | null;
  @Column({ type: "varchar", nullable: true }) firstName?: string | null;
  @Column({ type: "varchar", nullable: true }) lastName?: string | null;
  @Column({ type: "date", nullable: true }) birthday?: string | null;
  @Column({ type: "varchar", nullable: true }) addressStreet?: string | null;
  @Column({ type: "varchar", nullable: true }) addressStreetNo?: string | null;
  @Column({ type: "varchar", nullable: true }) addressCity?: string | null;
  @Column({ type: "varchar", nullable: true }) addressPostalCode?: string | null;
  @Column({ type: "varchar", nullable: true }) addressCountry?: string | null;
  @Column({ type: "varchar", nullable: true }) mobile?: string | null;
  @Column({ type: "varchar", nullable: true }) email?: string | null;
  @Column({ type: "text", nullable: true }) knownProblems?: string | null;
  @Column({ type: "varchar", array: true, nullable: true }) allergies?: string[] | null;
  @Column({ type: "varchar", nullable: true }) insuranceCardFile?: string | null;

  @DeleteDateColumn() deletedAt?: Date;

  @ManyToOne(() => Group, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group?: Group;

  @OneToMany(() => MemberContact, (mb) => mb.member)
  contacts?: MemberContact[];

  @OneToMany(() => MemberAchievement, (mb) => mb.member)
  achievements?: MemberAchievement[];

  @OneToMany(() => EventAttendee, (ea) => ea.member)
  eventAttendees?: EventAttendee[];

  @OneToOne(() => User, (user) => user.member)
  user?: User;
}
