import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

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
  _id!: Types.ObjectId;

  @Prop({ type: String, enum: ["public", "draft"], required: true, default: "draft" }) status!: MongoAlbumStatus;
  @Prop() name!: string;
  @Prop() description!: string;
  @Prop() year!: number;
  @Prop() srcId!: string;
  @Prop() datePublished!: Date;
  @Prop({ type: Date }) dateFrom!: Date;
  @Prop({ type: Date }) dateTill!: Date;
  @Prop({ type: SchemaTypes.ObjectId, ref: "MongoEvent" }) event!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: "MongoPhoto" }) titlePhoto!: string;
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: "MongoPhoto" }] }) titlePhotos!: string;
  @Prop([{ type: SchemaTypes.ObjectId, ref: "MongoPhoto" }]) photos!: [];
}

export const MongoAlbumSchema = SchemaFactory.createForClass(MongoAlbum);
