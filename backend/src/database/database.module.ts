import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Config } from "src/config";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				...config.db,
				autoLoadEntities: true,
			}),
		}),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule {}
