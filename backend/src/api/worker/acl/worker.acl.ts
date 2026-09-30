import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { FaceDetectionLogEntryResponse, FaceDetectionSummaryResponse, WorkerResponse } from "../dto/worker.dto";

export const WorkersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: WorkerResponse,
	allowed: {
		admin: true,
	},
});

export const FaceDetectionSummaryPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: FaceDetectionSummaryResponse,
	allowed: {
		admin: true,
	},
});

export const FaceDetectionLogPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: FaceDetectionLogEntryResponse,
	inherit: FaceDetectionSummaryPermission,
});

export const FaceDetectionBatchPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: FaceDetectionSummaryPermission,
});

export const FaceMatchingRunPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: FaceDetectionSummaryPermission,
});
