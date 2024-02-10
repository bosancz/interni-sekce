import axios from "axios";
import { IsOptional, IsString, validateSync } from "class-validator";

export var appConfig: AppConfig = {};

export class AppConfig {
  @IsString() @IsOptional() apiRoot?: string = "http://localhost:3000";
}

export async function loadConfig() {
  try {
    const data = await axios.get("/config.json").then((res) => res.data);

    if (validateConfig(data)) {
      appConfig = data;
    }
  } catch (err) {
    appConfig = {};
  }
}

function validateConfig(data: unknown): data is AppConfig {
  return validateSync(Object.assign(new AppConfig(), data)).length === 0;
}
