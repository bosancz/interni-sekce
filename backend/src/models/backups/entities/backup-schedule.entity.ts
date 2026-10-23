import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("backup_schedule")
export class BackupSchedule {
	@PrimaryColumn({ type: "int", default: 1 }) id!: number;

	@Column({ type: "varchar", nullable: true }) cron!: string | null;

	@Column({ type: "varchar", nullable: true }) timezone!: string | null;

	@Column({ type: "timestamp with time zone", nullable: true }) nextRunAt!: Date | null;

	@Column({ type: "timestamp with time zone", default: () => "now()" }) updatedAt!: Date;
}
