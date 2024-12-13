import path from 'path'
import { dl, gameDir } from '../../index.js'
import { DownloaderFile, DownloaderOpts } from '../../types/utils/Downloader.js'
import fsp from 'fs/promises'
import fs from 'fs'

export async function getGlobalManifest(): Promise<GlobalManifest> {
  const dir: string = path.resolve(gameDir, 'version')
  const name: string = 'global_manifest.json'
  const dest: string = path.resolve(dir, name)
  if (fs.existsSync(dest)) {
    const birthtimeMs: number = await fsp.stat(dest).then((stats) => stats.birthtimeMs)
    if (birthtimeMs + 86400000 > Date.now()) {
      console.log('File already exists, reading!')
      return JSON.parse(await fsp.readFile(dest, { encoding: 'utf8' }))
    }
  }

  const file: DownloaderFile = {
    url: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
    dir,
    name
  }
  const opts: DownloaderOpts = {
    overwrite: true,
    getContent: true
  }
  return await dl.downloadSingleFile<GlobalManifest>(file, opts)
}

export async function getVersionManifest(version?: string, globalManifest?: GlobalManifest): Promise<VersionManifest> {
  if (!globalManifest) globalManifest = await getGlobalManifest()

  const gmEntry: GlobalManifestVersion = globalManifest.versions.filter((x) => x.id == version || globalManifest.latest.release)[0]
  const file: DownloaderFile = {
    url: gmEntry.url,
    dir: path.resolve(gameDir, 'version', gmEntry.id),
    name: `${gmEntry.id}.json`
  }
  const opts: DownloaderOpts = {
    getContent: true,
    verify: {
      hash: gmEntry.sha1,
      algorithm: 'sha1'
    }
  }
  const dest = path.resolve(file.dir, file.name!)
  if (fs.existsSync(dest)) {
    console.log('File already exists, reading!')
    return JSON.parse(await fsp.readFile(dest, { encoding: 'utf8' }))
  }

  return await dl.downloadSingleFile<VersionManifest>(file, opts)
}

export async function getAssetIndex(versionManifest: VersionManifest): Promise<AssetIndex> {
  const assetIndex: VersionManifestAssetIndex = versionManifest.assetIndex;
  const file: DownloaderFile = {
    url: assetIndex.url,
    dir: path.resolve(gameDir, 'assets/indexes'),
    name: `${assetIndex.id}.json`,
    size: assetIndex.size
  }
  const opts: DownloaderOpts = {
    getContent: true,
    verify: {
      hash: assetIndex.sha1,
      algorithm: 'sha1'
    }
  }
  return await dl.downloadSingleFile<AssetIndex>(file, opts)
}
