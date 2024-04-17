import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "bo-home-chat",
  templateUrl: "./home-chat.component.html",
  styleUrl: "./home-chat.component.scss",
})
export class HomeChatComponent {
  prompt: string = "";

  constructor(private router: Router) {}

  sendPrompt() {
    if (this.prompt) {
      this.router.navigate(["/chat"], { queryParams: { prompt: this.prompt } });
    }
  }
}
