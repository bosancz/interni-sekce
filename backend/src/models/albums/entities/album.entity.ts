import { ApiHideProperty } from "@nestjs/swagger";
import { Event } from "src/models/events/entities/event.entity";
import { User } from "src/models/users/entities/user.entity";
import {
	Column,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Photo } from "./photo.entity";

export enum AlbumStatus {
	"public" = "public",
	"draft" = "draft",
}

@Entity("albums")
export class Album {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "integer", nullable: true })
	eventId!: number | null;

	@OneToOne(() => Event, (event) => event.album, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "event_id" })
	event?: Event;

	@OneToMany(() => Photo, (p) => p.album)
	photos?: Photo[];

	@Column({ nullable: false, default: AlbumStatus.draft, enum: AlbumStatus })
	status!: AlbumStatus;

	@Column({ nullable: false }) name!: string;

	@Index("IDX_albums_search_vector", { synchronize: false })
	@Column({
		type: "tsvector",
		nullable: true,
		select: false,
		asExpression: "to_tsvector('simple_unaccent', coalesce(name, ''))",
		generatedType: "STORED",
	})
	@ApiHideProperty()
	searchVector?: string;

	@Column({ type: "integer", nullable: true }) createdById!: number | null;

	@ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "created_by_id" })
	@ApiHideProperty()
	createdBy?: User | null;

	@Column({ type: "text", nullable: true }) description!: string | null;
	@Column({ type: "timestamp with time zone", nullable: true }) datePublished!: Date | string | null;
	@Column({ type: "date" }) dateFrom!: string | null;
	@Column({ type: "date" }) dateTill!: string | null;

	@DeleteDateColumn() deletedAt?: Date | null;
}
