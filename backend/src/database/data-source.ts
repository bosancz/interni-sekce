import { DataSource } from "typeorm";
import { StaticConfig } from "../config";

export const dataSource = new DataSource(StaticConfig.db);
