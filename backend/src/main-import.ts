import { CommandFactory } from "nest-commander";
import { MongoImportModule } from "./mongo-import/mongo-import.module";

async function bootstrap() {
  await CommandFactory.run(MongoImportModule, ["warn", "error", "log", "debug", "verbose"]);
}

bootstrap();
