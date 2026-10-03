import { SDK } from "src/sdk";

export interface AlbumPhotos {
	album: SDK.AlbumResponse;
	photos: SDK.PhotoResponseWithLinks[];
}

export function groupPhotosByAlbum(photos: SDK.PhotoResponseWithLinks[]): AlbumPhotos[] {
	const albums = new Map<number, AlbumPhotos>();
	for (const photo of photos) {
		if (!photo.album) continue;
		const group = albums.get(photo.albumId) ?? { album: photo.album, photos: [] };
		group.photos.push(photo);
		albums.set(photo.albumId, group);
	}
	return [...albums.values()];
}
