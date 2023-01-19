import { Event } from "src/models/events/entities/event.entity";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Photo } from "./photo.entity";

export enum AlbumStatus {
  "public" = "public",
  "draft" = "draft",
}

@Entity("albums")
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Event)
  event?: Event;

  @OneToMany(() => Photo, (p) => p.album)
  photos?: Photo[];

  @Column({ nullable: false, default: AlbumStatus.draft, enum: AlbumStatus })
  status!: AlbumStatus;

  @Column({ nullable: false }) name!: string;

  @Column({ type: "text" }) description!: string | null;
  @Column({ type: "timestamp with time zone" }) datePublished!: Date | null;
  @Column({ type: "date" }) dateFrom!: string | null;
  @Column({ type: "date" }) dateTill!: string | null;
}
