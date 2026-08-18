import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

/**
 * Access control for the unauthenticated public API consumed by the bosan.cz website.
 *
 * These permissions exist so the routes are advertised on the API root `_links`
 * (that is how the bosan.cz ApiService discovers resource URLs). They are open to
 * everyone (`verejnost`) and intentionally do NOT set `contains` so the
 * AcLinksInterceptor leaves the hand-built legacy response shape untouched.
 *
 * The `name` matches the resource key the bosan.cz frontend looks up, and `path`
 * emits a `{id}` URI template (bosan.cz expands `{...}` placeholders client-side).
 */

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
