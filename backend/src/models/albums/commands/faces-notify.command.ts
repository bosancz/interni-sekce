import { Command, CommandRunner } from "nest-commander";
import { PhotoFacesNotificationsService } from "../services/photo-faces-notifications.service";

@Command({
	name: "faces-notify",
	description: "Notify members about newly uploaded photos their faces were recognised on",
})
export class FacesNotifyCommand extends CommandRunner {
	constructor(private photoFacesNotificationsService: PhotoFacesNotificationsService) {
		super();
	}

	async run(): Promise<void> {
		await this.photoFacesNotificationsService.notifyNewPhotos();
	}
}
