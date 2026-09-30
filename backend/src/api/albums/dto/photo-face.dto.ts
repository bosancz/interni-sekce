import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { FaceEmotion, FaceEmotions, PhotoFaceAssignment } from "src/models/albums/schema/detected-faces";
import { Member } from "src/models/members/entities/member.entity";
import { PhotoResponse } from "./photo.dto";

export class FaceEmotionsResponse implements FaceEmotions {
	@ApiPropertyOptional() angry?: number;
	@ApiPropertyOptional() disgust?: number;
	@ApiPropertyOptional() fearful?: number;
	@ApiPropertyOptional() happy?: number;
	@ApiPropertyOptional() neutral?: number;
	@ApiPropertyOptional() sad?: number;
	@ApiPropertyOptional() surprised?: number;
}

export class PhotoFaceResponse {
	@ApiProperty() id!: number;
	@ApiProperty() photoId!: number;
	@ApiPropertyOptional({ type: "integer", nullable: true }) memberId!: number | null;

	@ApiProperty({ type: "number" }) x!: number;
	@ApiProperty({ type: "number" }) y!: number;
	@ApiProperty({ type: "number" }) width!: number;
	@ApiProperty({ type: "number" }) height!: number;
	@ApiPropertyOptional({ type: "number", nullable: true }) score!: number | null;
	@ApiPropertyOptional({ type: FaceEmotionsResponse, nullable: true }) emotions!: FaceEmotions | null;
	@ApiPropertyOptional({ enum: FaceEmotion, enumName: "FaceEmotionEnum", nullable: true })
	emotion!: FaceEmotion | null;

	@ApiPropertyOptional({ enum: PhotoFaceAssignment, enumName: "FaceAssignmentEnum", nullable: true })
	assignment!: PhotoFaceAssignment | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) matchScore!: number | null;

	@ApiPropertyOptional({ type: "string", nullable: true }) assignedAt!: Date | string | null;

	@ApiPropertyOptional({ type: MemberResponse, nullable: true }) member?: Member | null;
}

export class PhotoFaceUpdateBody {
	@ApiProperty({ type: "integer", nullable: true })
	@IsOptional()
	@IsInt()
	memberId!: number | null;
}

export class MemberPhotoResponse extends PhotoResponse {
	@ApiProperty({ type: PhotoFaceResponse }) face!: PhotoFaceResponse;
}
