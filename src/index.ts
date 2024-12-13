import * as path from 'node:path'
import { Downloader } from './utils/downloader.js'
import { downloadFabricLibraries } from './download/libraries/fabric.js'
import { getVersionManifest } from './meta/minecraft.js'
import { getFabricLauncherMetaForVersion } from './meta/fabric.js'
import { FabricLauncherMeta } from './types/meta/fabric/FabricLauncherMeta.js'

export const gameDir: string = path.resolve(process.cwd(), 'store')

export const dl: Downloader = new Downloader(undefined, {
  onDownloadProgress: (progress, _chunk, file) => {
    console.log(`Modified progress message of file ${file.url}!${progress.totalBytes == 0 ? '' : ` Downloaded: ${(progress.percent * 100).toFixed(2)}%`}`)
  }
})

const versionManifest: VersionManifest = await getVersionManifest('1.21')
const fabricLM: FabricLauncherMeta = await getFabricLauncherMetaForVersion(versionManifest)

const fabricCP: string[] = await downloadFabricLibraries(fabricLM)
console.log(JSON.stringify(fabricCP))



process.on('unhandledRejection', (err) => {
  console.error(`Unexpected error: "${err}"`)
})
