import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { access, mkdir, unlink, writeFile } from "fs/promises";
import { dirname } from "path";
import { Config } from "src/config";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await mkdir(Config.fs.dataDir, { recursive: true });
    await mkdir(Config.fs.membersDir, { recursive: true });
    await mkdir(Config.fs.eventsDir, { recursive: true });
    await mkdir(Config.fs.photosDir, { recursive: true });
    await mkdir(Config.fs.thumbnailsDir, { recursive: true });
  }

  async ensureDir(path: string) {
    return mkdir(path, { recursive: true });
  }

  async fileAccessible(path: string, mode?: number) {
    return access(path, mode);
  }

  async saveFile(path: string, data: string | Buffer) {
    await mkdir(dirname(path), { recursive: true });
    return writeFile(path, data);
  }

  async deleteFile(path: string) {
    return unlink(path);
  }
}
