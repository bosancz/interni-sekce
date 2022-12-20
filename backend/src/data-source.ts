import { DataSource } from "typeorm";
import { Config } from "./config";

export default new DataSource(Config.db);
