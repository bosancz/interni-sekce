import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { Config } from "src/config";

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [Config],
			useFactory: (config: Config) => {
				if (!config.redis.url) throw new Error("REDIS_URL environment variable must be set.");
				return { connection: { url: config.redis.url } };
			},
		}),
	],
})
export class QueueModelModule {}
