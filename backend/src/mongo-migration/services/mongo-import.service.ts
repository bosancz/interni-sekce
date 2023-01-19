import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { DateTime } from "luxon";
import { Model } from "mongoose";
import { Album } from "src/models/albums/entities/album.entity";
import { Repository } from "typeorm";
import { MongoAlbum } from "../models/album";

@Injectable()
export class MongoImportService {
  logger = new Logger(MongoImportService.name);

  constructor(
    @InjectModel(MongoAlbum.name) private albumsModel: Model<MongoAlbum>,
    @InjectRepository(Album) private albumsRepository: Repository<Album>,
  ) {}

  async importData() {
    console.log("Mongo import started.");
    await this.importAlbums();
  }

  async importAlbums() {
    console.debug("Importing albums...");

    const albums = await this.albumsModel.find({}).populate("photos").lean().exec();
    console.debug(`Found ${albums.length} albums in mongo.`);

    const deleteCount = await this.albumsRepository.delete({}).then((res) => res.affected);
    console.debug(`Removed ${deleteCount} albums in postgres.`);

    for (let album of albums) {
      const albumData: Omit<Album, "id"> = {
        dateFrom: album.dateFrom ? DateTime.fromJSDate(album.dateFrom).toISODate() : null,
        dateTill: album.dateTill ? DateTime.fromJSDate(album.dateTill).toISODate() : null,
        datePublished: album.datePublished ?? DateTime.local().toISO(),
        description: album.description ?? "",
        name: album.name,
        status: <any>album.status,
      };

      await this.albumsRepository.save(albumData);
    }

    console.log(`Imported ${albums.length} albums.`);
  }
}
