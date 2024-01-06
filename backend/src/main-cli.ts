import { CommandFactory } from "nest-commander";
import { CliModule } from "./cli/cli.module";

console.log("Hello from main-cli.ts");

async function bootstrap() {
  await CommandFactory.run(CliModule, ["warn", "error"]);
}

bootstrap();
