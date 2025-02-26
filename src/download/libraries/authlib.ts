import ky from "ky";
import { Launch } from "../../launch.js";
import { Artifact } from "../../types/meta/auth/authlib-injector/main.js";
import { DownloaderFile } from "../../types/utils/Downloader.js";
import path from "path";

export async function downloadAuthlib(launch: Launch): Promise<string> {
  const json: Artifact = await ky.get('https://authlib-injector.yushi.moe/artifact/latest.json').json()

  const file: DownloaderFile = {
    url: json.download_url,
    dir: path.resolve(launch.opts.rootDir, 'libraries/moe/yushi/authlib-injector'),
    name: `authlib-injector-${json.version}.jar`,
    type: 'libraries',
    verify: {
      hash: json.checksums.sha256,
      algorithm: 'sha256'
    }
  }
  await launch.dl.downloadSingleFile(file)
  return path.resolve(file.dir, file.name!)
}
