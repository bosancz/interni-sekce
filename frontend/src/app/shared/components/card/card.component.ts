import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "bo-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"],
})
export class CardComponent implements OnInit {
  @Input() title?: string;

  constructor() {}

  ngOnInit(): void {}
}
