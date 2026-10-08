import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min, ValidateIf } from "class-validator";
import { FaceEmotionsResponse, PhotoFaceResponse } from "src/api/albums/dto/photo-face.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Member } from "src/models/members/entities/member.entity";
import {
	FaceEmotion,
	FaceEmotions,
	FacesMatchTrigger,
	FaceReviewFilter,
	FaceReviewOrder,
	PhotoFaceAssignment,
} from "src/models/albums/schema/detected-faces";
import { WorkerCurrentJob, WorkerHeartbeat, WorkerStatus } from "src/models/worker/schema/worker-heartbeat";

export class WorkerCurrentJobResponse implements WorkerCurrentJob {
	@ApiProperty() task!: string;
	@ApiPropertyOptional({ type: "string", nullable: true }) jobId!: string | null;
	@ApiProperty() startedAt!: string;
}

export class WorkerResponse implements WorkerHeartbeat {
	@ApiProperty() id!: string;
	@ApiProperty() hostname!: string;
	@ApiProperty({ enum: WorkerStatus, enumName: "WorkerStatusEnum" }) status!: WorkerStatus;
	@ApiProperty({ type: "string", isArray: true }) tasks!: string[];
	@ApiPropertyOptional({ type: WorkerCurrentJobResponse, nullable: true }) current!: WorkerCurrentJob | null;
	@ApiProperty() cpus!: number;
	@ApiPropertyOptional({ type: "number", nullable: true }) cpuLimit!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) memoryLimit!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) memoryUsage!: number | null;
	@ApiProperty() processed!: number;
	@ApiProperty() failed!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) lastJobAt!: string | null;
	@ApiProperty() startedAt!: string;
	@ApiProperty() updatedAt!: string;
}

export class FaceDetectionScheduleResponse {
	@ApiProperty() cron!: string;
	@ApiProperty() stopCron!: string;
	@ApiProperty() matchCron!: string;
	@ApiProperty() timezone!: string;
	@ApiProperty() batchSize!: number;
}

export class FaceDetectionPhotosStatsResponse {
	@ApiProperty() total!: number;
	@ApiProperty() processed!: number;
	@ApiProperty() pending!: number;
	@ApiProperty() failed!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) lastDetectedAt!: Date | string | null;
}

export class FaceDetectionFacesStatsResponse {
	@ApiProperty() total!: number;
	@ApiProperty() assigned!: number;
	@ApiProperty() autoAssigned!: number;
}

export class FaceDetectionQueueResponse {
	@ApiProperty() waiting!: number;
	@ApiProperty() active!: number;
	@ApiProperty() delayed!: number;
	@ApiProperty() failed!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextBatchAt!: Date | string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextStopAt!: Date | string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextMatchAt!: Date | string | null;
}

export class FaceDetectionSummaryResponse {
	@ApiProperty({ type: FaceDetectionScheduleResponse }) schedule!: FaceDetectionScheduleResponse;
	@ApiProperty({ type: FaceDetectionPhotosStatsResponse }) photos!: FaceDetectionPhotosStatsResponse;
	@ApiProperty({ type: FaceDetectionFacesStatsResponse }) faces!: FaceDetectionFacesStatsResponse;
	@ApiProperty({ type: FaceDetectionQueueResponse }) queue!: FaceDetectionQueueResponse;
}

export class FaceDetectionLogFaceResponse {
	@ApiProperty() id!: number;
	@ApiProperty() photoId!: number;
	@ApiPropertyOptional({ type: "number", nullable: true }) score!: number | null;
	@ApiPropertyOptional({ type: "integer", nullable: true }) memberId!: number | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) memberNickname!: string | null;
	@ApiPropertyOptional({ enum: PhotoFaceAssignment, enumName: "FaceAssignmentEnum", nullable: true })
	assignment!: PhotoFaceAssignment | null;
	@ApiPropertyOptional({ type: FaceEmotionsResponse, nullable: true }) emotions!: FaceEmotions | null;
	@ApiPropertyOptional({ enum: FaceEmotion, enumName: "FaceEmotionEnum", nullable: true })
	emotion!: FaceEmotion | null;
}

export class FaceDetectionLogEntryResponse {
	@ApiProperty() photoId!: number;
	@ApiProperty() photoName!: string;
	@ApiProperty() albumId!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) albumName!: string | null;
	@ApiProperty({ type: "string" }) detectedAt!: Date | string;
	@ApiPropertyOptional({ type: "string", nullable: true }) model!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) error!: string | null;
	@ApiProperty({ type: FaceDetectionLogFaceResponse, isArray: true }) faces!: FaceDetectionLogFaceResponse[];
}

export class FaceDetectionLogQuery {
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(0) @IsOptional() offset?: number;
}

export class FaceDetectionBatchBody {
	@ApiPropertyOptional({ type: "integer" }) @IsInt() @Min(1) @Max(5000) @IsOptional() limit?: number;
}

export class FaceDetectionBatchResponse {
	@ApiProperty() queued!: number;
}

export class FaceMatchingSettingsResponse {
	@ApiProperty() threshold!: number;
	@ApiProperty() margin!: number;
	@ApiProperty() minDetectionScore!: number;
}

export class FaceMatchingSettingsUpdateBody {
	@ApiProperty() @IsNumber() @Min(0) @Max(1) threshold!: number;
}

export class FaceMatchingProgressResponse {
	@ApiProperty({ enum: FacesMatchTrigger, enumName: "FaceMatchingTriggerEnum" }) trigger!: FacesMatchTrigger;
	@ApiProperty({ type: "string" }) startedAt!: Date | string;
	@ApiProperty() photos!: number;
	@ApiProperty() processed!: number;
	@ApiProperty() assigned!: number;
	@ApiProperty() cleared!: number;
}

export class FaceMatchingRunResponse extends FaceMatchingProgressResponse {
	@ApiProperty({ type: "string" }) finishedAt!: Date | string;
	@ApiPropertyOptional({ type: "string", nullable: true }) error!: string | null;
}

export class FaceMatchingStatusResponse {
	@ApiPropertyOptional({ type: FaceMatchingProgressResponse, nullable: true })
	current!: FaceMatchingProgressResponse | null;
	@ApiProperty() queued!: boolean;
	@ApiPropertyOptional({ type: FaceMatchingRunResponse, nullable: true }) lastRun!: FaceMatchingRunResponse | null;
}

export class FaceMatchingFacesStatsResponse {
	@ApiProperty() total!: number;
	@ApiProperty() manual!: number;
	@ApiProperty() rejected!: number;
	@ApiProperty() auto!: number;
	@ApiProperty() unassigned!: number;
}

export class FaceMatchingEvaluationResponse {
	@ApiProperty() threshold!: number;
	@ApiProperty() assigned!: number;
	@ApiProperty() correct!: number;
	@ApiProperty() wrong!: number;
	@ApiPropertyOptional({ type: "number", nullable: true }) precision!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) recall!: number | null;
}

export class FaceMatchingAnalysisResponse {
	@ApiProperty() decisions!: number;
	@ApiProperty() correctCandidates!: number;
	@ApiProperty() wrongCandidates!: number;
	@ApiProperty() targetPrecision!: number;
	@ApiProperty() minDecisions!: number;
	@ApiProperty() minWrongCandidates!: number;
	@ApiProperty() enoughData!: boolean;
	@ApiProperty({ type: FaceMatchingEvaluationResponse }) current!: FaceMatchingEvaluationResponse;
	@ApiPropertyOptional({ type: FaceMatchingEvaluationResponse, nullable: true })
	proposed!: FaceMatchingEvaluationResponse | null;
	@ApiProperty({ type: FaceMatchingEvaluationResponse, isArray: true }) sweep!: FaceMatchingEvaluationResponse[];
}

export class FaceMatchingSummaryResponse {
	@ApiProperty({ type: FaceMatchingSettingsResponse }) settings!: FaceMatchingSettingsResponse;
	@ApiProperty({ type: FaceMatchingStatusResponse }) status!: FaceMatchingStatusResponse;
	@ApiProperty({ type: FaceMatchingFacesStatsResponse }) faces!: FaceMatchingFacesStatsResponse;
	@ApiProperty({ type: FaceMatchingAnalysisResponse }) analysis!: FaceMatchingAnalysisResponse;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextMatchAt!: Date | string | null;
}

export class FaceReviewQuery {
	@ApiPropertyOptional({ enum: FaceReviewOrder, enumName: "FaceReviewOrderEnum" })
	@IsEnum(FaceReviewOrder)
	@IsOptional()
	order?: FaceReviewOrder;

	@ApiPropertyOptional({ enum: FaceReviewFilter, enumName: "FaceReviewFilterEnum" })
	@IsEnum(FaceReviewFilter)
	@IsOptional()
	filter?: FaceReviewFilter;

	@ApiPropertyOptional({ type: "integer", isArray: true })
	@Transform(({ value }) => (value === undefined ? undefined : String(value).split(",").filter(Boolean).map(Number)))
	@IsInt({ each: true })
	@IsOptional()
	excludePhotoIds?: number[];

	@ApiPropertyOptional({ type: "integer" })
	@Type(() => Number)
	@IsInt()
	@ValidateIf((query: FaceReviewQuery) => query.filter === FaceReviewFilter.member || query.memberId !== undefined)
	memberId?: number;

	@ApiPropertyOptional({ type: "integer" })
	@Type(() => Number)
	@IsInt()
	@IsOptional()
	faceId?: number;
}

export class FaceReviewPhotoResponse {
	@ApiProperty() id!: number;
	@ApiProperty() name!: string;
	@ApiProperty() albumId!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) albumName!: string | null;
	@ApiPropertyOptional({ type: "integer", nullable: true }) width!: number | null;
	@ApiPropertyOptional({ type: "integer", nullable: true }) height!: number | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) bg!: string | null;
	@ApiProperty({ type: "string" }) timestamp!: Date | string;
}

export class FaceReviewFaceResponse extends PhotoFaceResponse {
	@ApiPropertyOptional({ type: "integer", nullable: true }) candidateMemberId!: number | null;
	@ApiPropertyOptional({ type: MemberResponse, nullable: true }) candidateMember?: Member | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) candidateScore!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) candidateSecondScore!: number | null;
}

export class FaceReviewResponse {
	@ApiPropertyOptional({ type: FaceReviewFaceResponse, nullable: true }) face!: FaceReviewFaceResponse | null;
	@ApiPropertyOptional({ type: FaceReviewPhotoResponse, nullable: true }) photo!: FaceReviewPhotoResponse | null;
	@ApiProperty() remaining!: number;
}
