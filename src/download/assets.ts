import { Launch } from '../launch.js'
import { AssetIndex, AssetIndexObject } from '../types/meta/minecraft/AssetIndex.js'
import { VersionManifest } from '../types/meta/minecraft/VersionManifest.js'
import type { DownloaderFile } from '../types/utils/Downloader.js'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import { getUniqueArrayBy } from '../utils/general.js'

export async function downloadAssets(launch: Launch, versionManifest: VersionManifest): Promise<string> {
  const assetRoot: string = path.resolve(launch.opts.rootDir, 'assets')

  const file: DownloaderFile = {
    url: versionManifest.assetIndex.url,
    dir: path.resolve(assetRoot, 'indexes'),
    name: `${versionManifest.assetIndex.id}.json`,
    type: 'assets',
    verify: {
      hash: versionManifest.assetIndex.sha1,
      algorithm: 'sha1'
    }
  }
  const assetIndex: AssetIndex = (await launch.dl.downloadSingleFile<AssetIndex>(file, { getContent: true }))!
  const assets: AssetIndexObject[] = getUniqueArrayBy(Object.values(assetIndex.objects), 'hash')

  // If there's assetIndex downloaded there's a good chance all other assets are as well. This checks if they are downloaded.
  if (fs.existsSync(path.resolve(file.dir, file.name!))) {
    try {
      const objectDirs: string[] = await fsp.readdir(path.resolve(assetRoot, 'objects'))
      const files: string[] = (await Promise.all(objectDirs.map((x) => fsp.readdir(path.resolve(assetRoot, 'objects', x))))).flat().sort()
      const assetsHashes: string[] = assets.map((x) => x.hash).sort()
      if (files.filter((x) => !assetsHashes.includes(x)).length <= 0) return assetRoot
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'ENOENT') {
          console.log(`That's enoent!!`)
        }
      }
      console.error(err)
    }
  }

  const files: DownloaderFile[] = assets.map((asset) => ({
    url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`,
    dir: path.resolve(assetRoot, 'objects', asset.hash.substring(0, 2)),
    name: `${asset.hash}`,
    type: 'assets',
    verify: {
      hash: asset.hash,
      algorithm: 'sha1'
    }
  }))

  console.log(`Submitting asset filelist`)
  await launch.dl.downloadMultipleFiles(files, {
    totalSize: Object.values(assetIndex.objects)
      .map((x) => x.size)
      .reduce((pV, x) => (pV += x))
  })
  return assetRoot
}
