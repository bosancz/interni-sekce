import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { BoardMember } from "src/models/members/entities/board-member.entity";

export class BoardMemberMemberResponse {
	@ApiProperty() id!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty({ required: false }) groupId?: number;
	@ApiProperty({ type: "string", nullable: true, required: false }) firstName?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) lastName?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) email?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) mobile?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) profilePhotoUpdatedAt?: Date | null;
}

export class BoardMemberResponse implements Omit<BoardMember, "member"> {
	memberId!: number;
	function!: string;
	@ApiProperty({ type: "number", nullable: true }) position!: number | null;
	@ApiProperty({ type: BoardMemberMemberResponse, required: false }) member?: BoardMemberMemberResponse;
}

export class BoardMemberUpdateBody implements Partial<Pick<BoardMember, "function">> {
	@IsString() @MinLength(1) @IsOptional() function?: string;
}

export class BoardMembersOrderBody {
	@ApiProperty({ type: "integer", isArray: true })
	@IsArray()
	@ArrayUnique()
	@IsInt({ each: true })
	memberIds!: number[];
}
