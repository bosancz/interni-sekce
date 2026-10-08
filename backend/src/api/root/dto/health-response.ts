import { ApiProperty } from "@nestjs/swagger";

export enum HealthStatus {
	ok = "ok",
	error = "error",
}

export class HealthResponse {
	@ApiProperty({ enum: HealthStatus, enumName: "HealthStatus" }) status!: HealthStatus;
	@ApiProperty({ enum: HealthStatus, enumName: "HealthStatus" }) database!: HealthStatus;
	@ApiProperty({ enum: HealthStatus, enumName: "HealthStatus" }) redis!: HealthStatus;
}
