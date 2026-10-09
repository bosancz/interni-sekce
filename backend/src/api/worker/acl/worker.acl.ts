import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import {
	FaceDetectionLogEntryResponse,
	FaceDetectionSummaryResponse,
	FaceMatchingSummaryResponse,
	FaceReviewResponse,
	ServerStatsResponse,
	WorkerResponse,
} from "../dto/worker.dto";
import {
	PhotoCategoryResponse,
	PhotoContentSearchHitResponse,
	PhotoContentSummaryResponse,
} from "../dto/photo-content.dto";

export const WorkersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: WorkerResponse,
	allowed: {
		admin: true,
	},
});

export const ServerStatsPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: ServerStatsResponse,
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

export const FaceMatchingSummaryPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: FaceMatchingSummaryResponse,
	inherit: FaceDetectionSummaryPermission,
});

export const FaceMatchingSettingsUpdatePermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: FaceDetectionSummaryPermission,
});

export const FaceReviewPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: FaceReviewResponse,
	inherit: FaceDetectionSummaryPermission,
});

export const PhotoContentSummaryPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoContentSummaryResponse,
	allowed: {
		admin: true,
	},
});

export const PhotoContentBatchPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: PhotoContentSummaryPermission,
});

export const PhotoContentSearchPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoContentSearchHitResponse,
	inherit: PhotoContentSummaryPermission,
});

export const PhotoCategoriesListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoCategoryResponse,
	allowed: {
		vedouci: true,
	},
});

export const PhotoCategoryReadPermission = new Permission({
	linkTo: PhotoCategoryResponse,
	contains: PhotoCategoryResponse,
	params: { categoryId: "id" },
	allowed: {
		vedouci: true,
	},
});

export const PhotoCategoryPhotosPermission = new Permission({
	linkTo: PhotoCategoryResponse,
	contains: PhotoContentSearchHitResponse,
	params: { categoryId: "id" },
	allowed: {
		vedouci: true,
	},
});

export const PhotoCategoryCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: PhotoContentSummaryPermission,
});

export const PhotoCategoryPreviewPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoContentSearchHitResponse,
	inherit: PhotoContentSummaryPermission,
});

export const PhotoCategoryEditPermission = new Permission({
	linkTo: PhotoCategoryResponse,
	params: { categoryId: "id" },
	allowed: {
		admin: true,
	},
});

export const PhotoCategoryDeletePermission = new Permission({
	linkTo: PhotoCategoryResponse,
	params: { categoryId: "id" },
	inherit: PhotoCategoryEditPermission,
});
