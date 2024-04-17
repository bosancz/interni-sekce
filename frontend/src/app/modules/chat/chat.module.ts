import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { ChatRoutingModule } from "./chat-routing.module";
import { ChatViewComponent } from "./pages/chat-view/chat-view.component";

@NgModule({
  declarations: [ChatViewComponent],
  imports: [CommonModule, ChatRoutingModule, SharedModule],
})
export class ChatModule {}
