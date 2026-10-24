import { AcAllowed } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { UserRoles } from "src/models/users/schema/user-roles";

const allowed: AcAllowed<void, UserRoles> = {
	public: true,
};

export const PublicProgramPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "program",
	allowed,
});

export const PublicProgramIcalPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "program:ical",
	allowed,
});

export const PublicGalleryPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "gallery",
	allowed,
});

export const PublicGalleryRecentPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "gallery:recent",
	allowed,
});

export const PublicGalleryAlbumPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "galleryalbum",
	allowed,
	path: () => "gallery/{id}",
});

export const PublicGalleryAlbumPreviewPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "galleryalbum:preview",
	allowed,
	path: () => "gallery/{id}/preview",
});

export const PublicGroupsPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "groups",
	allowed,
});

export const PublicBoardMembersPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "boardMembers",
	allowed,
});

export const PublicReportsPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "reports",
	allowed,
});

export const PublicReportPermission = new Permission<void>({
	linkTo: RootResponse,
	name: "report",
	allowed,
	path: () => "reports/{id}",
});
