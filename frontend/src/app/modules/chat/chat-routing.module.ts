import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ChatViewComponent } from "./pages/chat-view/chat-view.component";

const routes: Routes = [{ path: "", component: ChatViewComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChatRoutingModule {}
