import fs from "fs/promises";
import path from "path";

import type { File } from "../telegram";

class Storage {
  baseDir: string;

  constructor(baseDir = "./downloads") {
    this.baseDir = baseDir;
  }

  async saveFileFromUrl(url: string, file: File) {
    if (!file.file_path) throw new Error("No file_path specified!");

    const res = await fetch(url);

    const buffer = Buffer.from(await res.arrayBuffer());

    await fs.mkdir(this.baseDir, { recursive: true });

    const fileName = path.basename(file.file_path);
    const fullPath = path.join(this.baseDir, fileName);

    await fs.writeFile(fullPath, buffer);
    return fullPath;
  }
}

export default Storage;
