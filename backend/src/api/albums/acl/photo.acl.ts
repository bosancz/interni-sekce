import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { PhotoResponse } from "../dto/photo.dto";

export const PhotosListRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoReadRoute = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoCreateRoute = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoEditRoute = new Permission({
	linkTo: PhotoResponse,
	allowed: {
		vedouci: true,
	},
});

export const PhotoDeleteRoute = new Permission({
	linkTo: PhotoResponse,
	inherit: PhotoEditRoute,
});

export const PhotoReadFileRoute = new Permission({
	linkTo: PhotoResponse,
	inherit: PhotoReadRoute,
});
