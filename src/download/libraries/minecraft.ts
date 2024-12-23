import path from 'path'
import type { DownloaderFile } from '../../types/utils/Downloader.js'
import { Launch } from '../../launch.js'
import { mojangArchMapping, mojangOsMapping } from '../../utils/general.js'
import { VersionManifest } from '../../types/meta/minecraft/VersionManifest.js'

export async function downloadMinecraftLibraries(launch: Launch, versionManifest: VersionManifest): Promise<string[]> {
  const files: DownloaderFile[] = []
  const cp: string[] = []

  libLoop: for (const lib of versionManifest.libraries) {
    if (lib.rules)
      for (const rule of lib.rules) {
        if ((rule.os.arch && rule.os.arch != mojangArchMapping[process.arch]) || (rule.os.name && rule.os.name != mojangOsMapping[process.platform])) {
          // console.error(`Not adding library ${lib.name} because it was made for ${rule.os.name} (${rule.os.arch}) and we're running ${MojangLib[process.platform]} (${mojangArchMapping[process.arch]})`)
          continue libLoop
        }
      }
    const file: DownloaderFile = {
      url: lib.downloads.artifact.url,
      dir: path.resolve(launch.opts.rootDir, 'libraries', path.dirname(lib.downloads.artifact.path)),
      name: path.basename(lib.downloads.artifact.path),
      type: 'libraries',
      verify: {
        hash: lib.downloads.artifact.sha1,
        algorithm: 'sha1'
      }
    }
    files.push(file)
    cp.push(path.resolve(file.dir, file.name!))
  }
  const clientJarFile: DownloaderFile = {
    url: versionManifest.downloads.client.url,
    dir: path.resolve(launch.opts.rootDir, 'version', versionManifest.id),
    name: `${versionManifest.id}.jar`,
    type: 'libraries',
    verify: {
      hash: versionManifest.downloads.client.sha1,
      algorithm: 'sha1'
    }
  }
  files.push(clientJarFile)
  cp.push(path.resolve(clientJarFile.dir, clientJarFile.name!))
  await launch.dl.downloadMultipleFiles(files, {
    totalSize: versionManifest.libraries.map((x) => x.downloads.artifact.size).reduce((partialSum, x) => partialSum + x, 0) + versionManifest.downloads.client.size
  })
  return cp
}
