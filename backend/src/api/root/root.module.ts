import { Module } from "@nestjs/common";
import { RootController } from "./controllers/root.controller";

@Module({
	controllers: [RootController],
})
export class RootModule {}
