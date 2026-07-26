import { Module } from "@nestjs/common";
import { GithubService } from "./services/github.service";

@Module({
	providers: [GithubService],
	exports: [GithubService],
})
export class GithubModelModule {}
