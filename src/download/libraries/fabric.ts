import path from "path";
import { dl, gameDir } from "../../index.js";
import { FabricLauncherMeta } from "../../types/meta/fabric/FabricLauncherMeta.js";
import { DownloaderFile } from "../../types/utils/Downloader.js";
import { mavenParse } from "../../utils/mavenParser.js";
import { MavenParserReturn } from "../../types/utils/MavenParser.js";

export async function downloadFabricLibraries(fabricLauncherMeta: FabricLauncherMeta): Promise<string[]> {
  const files: DownloaderFile[] = []
  const resolves: MavenParserReturn[] = []
  for (const lib of [...fabricLauncherMeta.launcherMeta.libraries.client, ...fabricLauncherMeta.launcherMeta.libraries.common]) {
    const resolved: MavenParserReturn = mavenParse(lib.url, lib.name)

    const file: DownloaderFile = {
      url: resolved.url,
      dir: path.resolve(gameDir, 'libraries', resolved.filedir),
      name: resolved.filename,
      verify: {
        hash: lib.sha1,
        algorithm: 'sha1'
      }
    }
    files.push(file)
    resolves.push(resolved)
  }
  dl.downloadMultipleFiles(files)
  return resolves.map(x => path.resolve(x.filedir, x.filename))
}
