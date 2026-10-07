import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Photo } from "./photo.entity";

@Entity("photo_embeddings")
export class PhotoEmbedding {
	@PrimaryColumn({ type: "integer" })
	photoId!: number;

	@PrimaryColumn({ type: "smallint", default: 0 })
	crop!: number;

	@ManyToOne(() => Photo, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "photo_id" })
	photo?: Photo;

	@Column({ type: "bytea", nullable: true, select: false })
	embedding?: Buffer | null;

	@Column({ type: "varchar", nullable: true }) model!: string | null;
	@Column({ type: "varchar", nullable: true }) error!: string | null;

	@Column({ type: "timestamp with time zone", nullable: false, default: () => "now()" })
	createdAt!: Date;
}
