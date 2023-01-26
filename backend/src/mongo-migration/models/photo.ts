import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({
  collection: "photos",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MongoPhoto {
  @Prop() title?: string;
  @Prop() name?: string;
  @Prop() caption?: string;
  @Prop() width?: number;
  @Prop() height?: number;
  @Prop() date?: Date;
  @Prop({ type: [String] }) tags?: string[];
  @Prop() fromSized?: boolean;
  @Prop() bg?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: "User" }) uploadedBy?: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: "Album", required: true }) album!: Types.ObjectId;

  @Prop(
    raw({
      original: { width: Number, height: Number, file: String },
      big: { width: Number, height: Number, file: String },
      small: { width: Number, height: Number, file: String },
    }),
  )
  sizes?: {
    original: { width: number; height: number; file: string };
    big: { width: number; height: number; file: string };
    small: { width: number; height: number; file: string };
  };

  @Prop(
    raw([
      {
        rectangle: {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
        },

        descriptor: [Number],

        expression: String,

        member: { type: SchemaTypes.ObjectId, ref: "Member", required: true },
      },
    ]),
  )
  faces?: [
    {
      rectangle: {
        x: number;
        y: number;
        width: number;
        height: number;
      };

      descriptor: [number];

      expression: string;

      member: Types.ObjectId;
    },
  ];
}

export const MongoPhotoSchema = SchemaFactory.createForClass(MongoPhoto);

MongoPhotoSchema.index({ tags: 1 }, { sparse: true });

MongoPhotoSchema.index({ album: 1, tags: 1 }, { sparse: true });
