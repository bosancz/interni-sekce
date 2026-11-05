import { join } from "path";
import { Album } from "../entities/album.entity";

export function getAlbumChroniclePath(albumsDir: string, album: Pick<Album, "id">): string {
	return join(albumsDir, String(album.id), "kronika.pdf");
}
