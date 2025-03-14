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
    size: versionManifest.assetIndex.size,
    verify: {
      hash: versionManifest.assetIndex.sha1,
      algorithm: 'sha1'
    }
  }
  const assetIndex: AssetIndex = (await launch.dl.downloadSingleFile<AssetIndex>(file, { getContent: true }))!
  const assets: AssetIndexObject[] = getUniqueArrayBy(Object.values(assetIndex.objects), 'hash')

  // If there's assetIndex downloaded there's a good chance all other assets are as well. This checks if they are downloaded.
  let missingObjects: string[] = []
  if (fs.existsSync(path.resolve(file.dir, file.name!))) {
    try {
      const objectDirs: string[] = await fsp.readdir(path.resolve(assetRoot, 'objects'))
      const files: string[] = (await Promise.all(objectDirs.map((x) => fsp.readdir(path.resolve(assetRoot, 'objects', x))))).flat().sort()
      const ogObjects: string[] = assets.map((x) => x.hash).sort()
      missingObjects = ogObjects.filter((x) => !files.includes(x))
      if (missingObjects.length <= 0) return assetRoot
    } catch (err) {
      console.error(err)
    }
  }

  let files: DownloaderFile[] = assets.map((asset) => ({
    url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`,
    dir: path.resolve(assetRoot, 'objects', asset.hash.substring(0, 2)),
    name: `${asset.hash}`,
    type: 'assets',
    size: asset.size,
    verify: {
      hash: asset.hash,
      algorithm: 'sha1'
    }
  }))

  // Remove anything except missing objects if there are missing objects
  if (missingObjects.length > 0) {
    files = files.filter(x => missingObjects.includes(x.name!))
  }

  console.log(`Submitting asset filelist (${files.length} entries)`)
  await launch.dl.downloadMultipleFiles(files, {
    totalSize: Object.values(assetIndex.objects)
      .map((x) => x.size)
      .reduce((pV, x) => (pV += x))
  })
  return assetRoot
}
