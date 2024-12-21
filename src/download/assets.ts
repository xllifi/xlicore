import { Launch } from '../launch.js'
import { DownloaderFile } from '../types/utils/Downloader.js'
import path from 'path'

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
  const assetIndex: AssetIndex = await launch.dl.downloadSingleFile<AssetIndex>(file, { getContent: true })
  const totalSize = Object.values(assetIndex.objects).map(x => x.size).reduce((pV, x) => pV += x)
  const files: DownloaderFile[] = []
  for (const asset of Object.values(assetIndex.objects)) {
    console.log(`Populating asset filelist`)
    const file: DownloaderFile = {
      url: `https://resources.download.minecraft.net/${asset.hash.substring(0,2)}/${asset.hash}`,
      dir: path.resolve(assetRoot, 'objects', asset.hash.substring(0,2)),
      name: `${asset.hash}`,
      type: 'assets',
      size: totalSize,
      verify: {
        hash: asset.hash,
        algorithm: 'sha1'
      }
    }
    files.push(file)
  }
  console.log(`Submitting asset filelist`)
  await launch.dl.downloadMultipleFiles(files)
  return assetRoot
}
