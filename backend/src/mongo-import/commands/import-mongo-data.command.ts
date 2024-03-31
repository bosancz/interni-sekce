import { Command, CommandRunner } from "nest-commander";
import { MongoImportService } from "../services/mongo-import.service";

@Command({
  name: "mongo-import",
  arguments: "",
  options: {},
})
export class StartImportCommand extends CommandRunner {
  constructor(private mongoImportService: MongoImportService) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    await this.mongoImportService.importData();
  }
}
