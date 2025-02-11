import { Component, Input, OnInit } from "@angular/core";
import { NavController } from "@ionic/angular";
import { AlbumResponseWithLinks } from "src/app/api";

@Component({
    selector: "bo-albums-tabs",
    templateUrl: "./albums-tabs.component.html",
    styleUrls: ["./albums-tabs.component.scss"],
    standalone: false
})
export class AlbumsTabsComponent implements OnInit {
  @Input() album?: AlbumResponseWithLinks;
  @Input() selected?: "info" | "fotky";

  constructor(private navController: NavController) {}

  ngOnInit(): void {}

  openTab(id: string) {
    if (!this.album) return;

    const path = `/galerie/${this.album.id}/${id}`;

    this.navController.navigateForward(path, { animated: false, replaceUrl: true });
  }
}
