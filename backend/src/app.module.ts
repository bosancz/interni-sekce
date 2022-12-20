import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as path from "path";
import { EventsModule } from "./api/events/events.module";
import { MembersModule } from "./api/members/members.module";
import { PublicModule } from "./api/public/public.module";
import { Config } from "./config";
import { AccessControlModule } from "./models/access-control/access-control.module";
import { AuthModule } from "./models/auth/auth.module";
import { MembersModelModule } from "./models/members/members-model.module";

const typeOrmOptions: TypeOrmModuleOptions = {
  ...Config.db,
  autoLoadEntities: true,
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "../../frontend/dist"),
    }),
    TypeOrmModule.forRoot(typeOrmOptions),
    EventsModule,
    AccessControlModule,
    EventsModule,
    PublicModule,
    MembersModule,
    AuthModule,
    MembersModelModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
