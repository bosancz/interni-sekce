import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ServeStaticModule } from "@nestjs/serve-static";
import { memoryStorage } from "multer";
import { AccessControlModule } from "./access-control/access-control.module";
import { AccountModule } from "./api/account/account.module";
import { AlbumsModule } from "./api/albums/albums.module";
import { EventsModule } from "./api/events/events.module";
import { FeedbackModule } from "./api/feedback/feedback.module";
import { MembersModule } from "./api/members/members.module";
import { OauthModule } from "./api/oauth/oauth.module";
import { PaymentsModule } from "./api/payments/payments.module";
import { PublicModule } from "./api/public/public.module";
import { RootModule } from "./api/root/root.module";
import { StatisticsModule } from "./api/statistics/statistics.module";
import { UsersModule } from "./api/users/users.module";
import { AuthModule } from "./auth/auth.module";
import { Config, ConfigModule } from "./config";
import { DatabaseModule } from "./database/database.module";
import { AlbumsModelModule } from "./models/albums/albums-model.module";
import { FilesModule } from "./models/files/files.module";
import { GoogleModelModule } from "./models/google/google-model.module";
import { MailService } from "./models/mail/services/mail.service";
import { MembersModelModule } from "./models/members/members-model.module";
import { SettingsModelModule } from "./models/settings/settings-model.module";
import { StatisticsModelModule } from "./models/statistics/statistics-model.module";
import { UsersModelModule } from "./models/users/users-model.module";

@Module({
	imports: [
		DatabaseModule,
		ConfigModule,
		ServeStaticModule.forRootAsync({
			inject: [Config],
			useFactory: (config: Config) => [{ rootPath: config.server.staticRoot }],
		}),
		MulterModule.register({
			// in-memory storage so handlers that read file.buffer (photos, insurance cards) work;
			// handlers that need a file on disk (event registration) set their own dest per-route
			storage: memoryStorage(),
			limits: {
				fileSize: 1024 * 1024 * 100, // 100 MB
			},
		}),
		EventsModule,
		EventsModule,
		FeedbackModule,
		PublicModule,
		MembersModule,
		PaymentsModule,
		AuthModule,
		UsersModule,
		MembersModelModule,
		SettingsModelModule,
		AlbumsModelModule,
		UsersModelModule,
		AlbumsModule,
		AccessControlModule,
		AccountModule,
		OauthModule,
		StatisticsModule,
		RootModule,
		StatisticsModelModule,
		GoogleModelModule,
		FilesModule,
	],
	controllers: [],
	providers: [MailService],
})
export class AppModule {}
