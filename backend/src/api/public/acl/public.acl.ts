import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const PublicProgramPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "program",
	allowed: { verejnost: true },
});

export const PublicProgramIcalPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "program:ical",
	allowed: { verejnost: true },
});

export const PublicGalleryPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "gallery",
	allowed: { verejnost: true },
});

export const PublicGalleryRecentPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "gallery:recent",
	allowed: { verejnost: true },
});

export const PublicGalleryAlbumPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "galleryalbum",
	allowed: { verejnost: true },
	path: () => "gallery/{id}",
});

export const PublicGalleryAlbumPreviewPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "galleryalbum:preview",
	allowed: { verejnost: true },
	path: () => "gallery/{id}/preview",
});
