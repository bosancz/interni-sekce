import { Component, OnInit } from "@angular/core";

@Component({
  selector: "bo-card-content",
  templateUrl: "./card-content.component.html",
  styleUrls: ["./card-content.component.scss"],
  host: {
    class: "p-lg-3",
  },
})
export class CardContentComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
