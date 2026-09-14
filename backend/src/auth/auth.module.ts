import { Global, MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RootController } from "src/api/root/controllers/root.controller";
import { Config } from "src/config";
import { UsersModelModule } from "src/models/users/users-model.module";
import { TokenMiddleware } from "./middlewares/token.middleware";
import { HashService } from "./services/hash.service";
import { TokenService } from "./services/token.service";

@Global()
@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({ secret: config.jwt.secret }),
		}),
		UsersModelModule,
	],
	providers: [TokenService, HashService],
	exports: [HashService, TokenService],
})
export class AuthModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(TokenMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });

		consumer.apply(TokenMiddleware).forRoutes(RootController);
	}
}
