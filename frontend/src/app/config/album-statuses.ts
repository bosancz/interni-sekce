import { AlbumResponseWithLinksStatusEnum } from "../api";

export interface AlbumStatusInfo {
  name: string;
  color: string;
}

export const AlbumStatuses: { [key in AlbumResponseWithLinksStatusEnum]: AlbumStatusInfo } = {
  draft: {
    name: "Připravované",
    color: "#92949c",
  },

  public: {
    name: "Veřejné",
    color: "#2dd36f",
  },
};
