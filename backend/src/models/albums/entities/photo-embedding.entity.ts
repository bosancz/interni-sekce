import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { PHOTO_EMBEDDING_DIMENSION } from "../helpers/photo-embeddings";
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

	@Column({ type: "halfvec", length: PHOTO_EMBEDDING_DIMENSION, nullable: true, select: false })
	embedding?: number[] | null;

	@Column({ type: "varchar", nullable: true }) model!: string | null;
	@Column({ type: "varchar", nullable: true }) error!: string | null;

	@Column({ type: "timestamp with time zone", nullable: false, default: () => "now()" })
	createdAt!: Date;
}
