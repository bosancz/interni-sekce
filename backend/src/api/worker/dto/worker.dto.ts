import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { FaceEmotionsResponse } from "src/api/albums/dto/photo-face.dto";
import { FaceEmotion, FaceEmotions, PhotoFaceAssignment } from "src/models/albums/schema/detected-faces";
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
	@ApiProperty() enabled!: boolean;
	@ApiProperty({ type: FaceDetectionScheduleResponse }) schedule!: FaceDetectionScheduleResponse;
	@ApiProperty({ type: FaceDetectionPhotosStatsResponse }) photos!: FaceDetectionPhotosStatsResponse;
	@ApiProperty({ type: FaceDetectionFacesStatsResponse }) faces!: FaceDetectionFacesStatsResponse;
	@ApiPropertyOptional({ type: FaceDetectionQueueResponse, nullable: true })
	queue!: FaceDetectionQueueResponse | null;
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
