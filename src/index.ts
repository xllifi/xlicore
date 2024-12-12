import * as path from 'node:path'
import { Downloader } from './utils/downloader.js'
import { getAssetIndex, getVersionManifest } from './meta/minecraft/index.js'

export const gameDir: string = path.resolve(process.cwd(), 'store')

export const dl: Downloader = new Downloader(undefined, {
  onDownloadProgress: (progress, _chunk, file) => {
    console.log(`Modified progress message of file ${file.url}!${progress.totalBytes == 0 ? '' : ` Downloaded: ${(progress.percent * 100).toFixed(2)}%`}`)
  }
})

const versionManifest = await getVersionManifest('1.21')
getAssetIndex(versionManifest)

process.on('unhandledRejection', (err) => {
  console.error(`Something happened: ${err}`)
})
