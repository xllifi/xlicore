import path from "path";
import { FabricLauncherMeta, FabricLauncherMetaDownload } from "../../types/meta/fabric/FabricLauncherMeta.js";
import { DownloaderFile } from "../../types/utils/Downloader.js";
import { mavenParse } from "../../utils/mavenParser.js";
import { MavenParserReturn } from "../../types/utils/MavenParser.js";
import ky from "ky";
import { Launch } from "../../launch.js";

export async function downloadFabricLibraries(launch: Launch, fabricLauncherMeta: FabricLauncherMeta): Promise<string[]> {
  const files: DownloaderFile[] = []
  const cp: string[] = []
  const libs: FabricLauncherMetaDownload[] = [...fabricLauncherMeta.launcherMeta.libraries.client, ...fabricLauncherMeta.launcherMeta.libraries.common]

  // Resolve special files' mavens
  const loaderResolved = mavenParse('https://maven.fabricmc.net/', fabricLauncherMeta.loader.maven)
  const intermediaryResolved = mavenParse('https://maven.fabricmc.net/', fabricLauncherMeta.intermediary.maven)

  // Calculate total size
  let totalSize: number = libs.map(x => x.size).reduce((partialSum, x) => partialSum+x, 0)
  totalSize += await ky.head(loaderResolved.url).then((res) => parseInt(res.headers.get('content-length')!))
  totalSize += await ky.head(intermediaryResolved.url).then((res) => parseInt(res.headers.get('content-length')!))

  // Add special files
  // Loader
  const loaderFile: DownloaderFile = {
    url: loaderResolved.url,
    dir: path.resolve(launch.opts.rootDir, 'libraries', loaderResolved.filedir),
    name: loaderResolved.filename,
    type: 'libraries',
    size: totalSize,
    verify: {
      hash: await ky.get<string>(loaderResolved.url+'.sha1').text(),
      algorithm: 'sha1'
    }
  }
  files.push(loaderFile)
  cp.push(path.resolve(loaderFile.dir, loaderFile.name!))
  // Intermediary
  const intermediaryFile: DownloaderFile = {
    url: intermediaryResolved.url,
    dir: path.resolve(launch.opts.rootDir, 'libraries', intermediaryResolved.filedir),
    name: intermediaryResolved.filename,
    type: 'libraries',
    size: totalSize,
    verify: {
      hash: await ky.get<string>(intermediaryResolved.url+'.sha1').text(),
      algorithm: 'sha1'
    }
  }
  files.push(intermediaryFile)
  cp.push(path.resolve(intermediaryFile.dir, intermediaryFile.name!))

  // Add normal libraries
  for (const lib of libs) {
    const resolved: MavenParserReturn = mavenParse(lib.url, lib.name)

    const file: DownloaderFile = {
      url: resolved.url,
      dir: path.resolve(launch.opts.rootDir, 'libraries', resolved.filedir),
      name: resolved.filename,
      type: 'libraries',
      size: totalSize,
      verify: {
        hash: lib.sha1,
        algorithm: 'sha1'
      }
    }
    files.push(file)
    cp.push(path.resolve(file.dir, file.name!))
  }

  // Download and return classpath
  await launch.dl.downloadMultipleFiles(files)
  return cp
}
