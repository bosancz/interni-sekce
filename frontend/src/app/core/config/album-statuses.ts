import { SDK } from "src/sdk";

export interface AlbumStatusInfo {
	name: string;
	color: string;
}

export const AlbumStatuses: { [key in SDK.AlbumResponseWithLinksStatusEnum]: AlbumStatusInfo } = {
	draft: {
		name: "Připravované",
		color: "#6b7185",
	},

	public: {
		name: "Veřejné",
		color: "#799f3d",
	},
};
