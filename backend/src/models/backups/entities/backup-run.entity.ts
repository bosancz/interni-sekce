import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BackupRunProgress, BackupRunStatuses, BackupRunTypes } from "../schema/backup-run";

@Entity("backup_runs")
@Index(["type", "startedAt"])
export class BackupRun {
	@PrimaryGeneratedColumn() id!: number;

	@Column({ type: "enum", enum: BackupRunTypes }) type!: BackupRunTypes;

	@Column({ type: "enum", enum: BackupRunStatuses, default: BackupRunStatuses.running }) status!: BackupRunStatuses;

	@Column({ type: "timestamp with time zone", default: () => "now()" }) startedAt!: Date;

	@Column({ type: "timestamp with time zone", nullable: true }) finishedAt!: Date | null;

	@Column({ type: "varchar", nullable: true }) fileName!: string | null;

	@Column({
		type: "bigint",
		nullable: true,
		transformer: { to: (value) => value, from: (value) => (value === null ? null : Number(value)) },
	})
	bytes!: number | null;

	@Column({ type: "int", nullable: true }) filesTransferred!: number | null;

	@Column({ type: "int", nullable: true }) filesRemoved!: number | null;

	@Column({ type: "jsonb", nullable: true }) progress!: BackupRunProgress | null;

	@Column({ type: "text", nullable: true }) error!: string | null;
}
