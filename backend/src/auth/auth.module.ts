import { Global, MiddlewareConsumer, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { Config } from "src/config";
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
  ],
  providers: [TokenService, HashService],
  exports: [HashService, TokenService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes("*");
  }
}
