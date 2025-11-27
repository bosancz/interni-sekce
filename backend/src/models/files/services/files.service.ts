import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { access, mkdir, unlink, writeFile , rename, readdir} from "fs/promises";
import { dirname, join} from "path";
import { Config } from "src/config";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  constructor(private readonly config: Config) {}

  async onApplicationBootstrap() {
    await mkdir(this.config.fs.dataDir, { recursive: true });
    await mkdir(this.config.fs.membersDir, { recursive: true });
    await mkdir(this.config.fs.eventsDir, { recursive: true });
    await mkdir(this.config.fs.photosDir, { recursive: true });
    await mkdir(this.config.fs.thumbnailsDir, { recursive: true });
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

  async moveFile(oldPath: string, newPath: string) {
    await this.ensureDir(dirname(newPath));
    return rename(oldPath, newPath);
  }

  async deleteFilesByPrefix(directoryPath: string, prefix: string): Promise<void> {
    const files = await readdir(directoryPath);
    const matchingFiles = files.filter((file) => file.startsWith(prefix));
    
    await Promise.all(
      matchingFiles.map((file) => unlink(join(directoryPath, file)))
    );
  }

  async getFilesByPrefx(directoryPath: string, prefix: string): Promise<string[]> {
  const files = await readdir(directoryPath);
  const matchingFiles = files.filter((file) => file.startsWith(prefix));
  return matchingFiles;
  }
}
