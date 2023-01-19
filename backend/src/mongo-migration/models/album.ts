import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

enum MongoAlbumStatus {
  "public" = "public",
  "draft" = "draft",
}

@Schema({
  collection: "albums",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MongoAlbum {
  @Prop({ type: String, enum: ["public", "draft"], required: true, default: "draft" }) status!: MongoAlbumStatus;
  @Prop() name!: string;
  @Prop() description!: string;
  @Prop() year!: number;
  @Prop() srcId!: string;
  @Prop() datePublished!: Date;
  @Prop({ type: Date }) dateFrom!: Date;
  @Prop({ type: Date }) dateTill!: Date;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "MongoEvent" }) event!: Event;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "MongoPhoto" }) titlePhoto!: string;
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "MongoPhoto" }] }) titlePhotos!: string;
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "MongoPhoto" }]) photos!: [];
}

export const MongoAlbumSchema = SchemaFactory.createForClass(MongoAlbum);
