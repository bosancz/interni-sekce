import { Global, MiddlewareConsumer, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { Config } from "src/config";
import { TokenMiddleware } from "./middlewares/token.middleware";
import { AuthService } from "./services/auth.service";
import { HashService } from "./services/hash.service";

@Global()
@Module({
  imports: [JwtModule.register({ secret: Config.jwt.secret })],
  providers: [AuthService, HashService],
  exports: [AuthService, HashService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes("*");
  }
}
