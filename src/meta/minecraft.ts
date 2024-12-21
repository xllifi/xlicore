import path from 'path'
import { DownloaderFile, DownloaderOpts } from '../types/utils/Downloader.js'
import fsp from 'fs/promises'
import fs from 'fs'
import { Launch } from '../launch.js'

export async function getGlobalManifest(launch: Launch): Promise<GlobalManifest> {
  const dir: string = path.resolve(launch.opts.rootDir, 'version')
  const name: string = 'global_manifest.json'
  const dest: string = path.resolve(dir, name)
  if (fs.existsSync(dest)) {
    const birthtimeMs: number = await fsp.stat(dest).then((stats) => stats.birthtimeMs)
    if (birthtimeMs + 86400000 > Date.now()) {
      // console.log('[MC Meta] File already exists, reading!')
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
  return await launch.dl.downloadSingleFile<GlobalManifest>(file, opts)
}

export async function getVersionManifest(launch: Launch, version?: string, globalManifest?: GlobalManifest): Promise<VersionManifest> {
  if (!globalManifest) globalManifest = await getGlobalManifest(launch)

  const gmEntry: GlobalManifestVersion = globalManifest.versions.filter((x) => x.id === (version ? version : globalManifest.latest.release))[0]
  const file: DownloaderFile = {
    url: gmEntry.url,
    dir: path.resolve(launch.opts.rootDir, 'version', gmEntry.id),
    name: `${gmEntry.id}.json`,
    verify: {
      hash: gmEntry.sha1,
      algorithm: 'sha1'
    }
  }
  const opts: DownloaderOpts = {
    getContent: true
  }

  return await launch.dl.downloadSingleFile<VersionManifest>(file, opts)
}

export async function getAssetIndex(launch: Launch, versionManifest: VersionManifest): Promise<AssetIndex> {
  const assetIndex: VersionManifestAssetIndex = versionManifest.assetIndex;
  const file: DownloaderFile = {
    url: assetIndex.url,
    dir: path.resolve(launch.opts.rootDir, 'assets/indexes'),
    name: `${assetIndex.id}.json`,
    size: assetIndex.size,
    verify: {
      hash: assetIndex.sha1,
      algorithm: 'sha1'
    }
  }
  const opts: DownloaderOpts = {
    getContent: true
  }
  return await launch.dl.downloadSingleFile<AssetIndex>(file, opts)
}
