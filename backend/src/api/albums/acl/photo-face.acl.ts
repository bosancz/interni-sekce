import { Permission } from "src/access-control/schema/route-acl";
import { PhotoFaceResponse } from "../dto/photo-face.dto";
import { PhotoResponse } from "../dto/photo.dto";
import { PhotoReadPermission } from "./photo.acl";

export const PhotoFacesListPermission = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoFaceResponse,
	params: { photoId: "id" },
	inherit: PhotoReadPermission,
});

export const PhotoFaceReadFilePermission = new Permission({
	linkTo: PhotoFaceResponse,
	params: { photoId: "photoId", faceId: "id" },
	allowed: {
		vedouci: true,
	},
});

export const PhotoFaceEditPermission = new Permission({
	linkTo: PhotoFaceResponse,
	params: { photoId: "photoId", faceId: "id" },
	allowed: {
		vedouci: true,
	},
});

export const PhotoFaceDeletePermission = new Permission({
	linkTo: PhotoFaceResponse,
	params: { photoId: "photoId", faceId: "id" },
	inherit: PhotoFaceEditPermission,
});
