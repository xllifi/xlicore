import ky from 'ky'
import { FabricLauncherMeta } from '../types/meta/fabric/FabricLauncherMeta.js'
import { dl, gameDir } from '../index.js'
import { DownloaderFile, DownloaderOpts } from '../types/utils/Downloader.js'
import path from 'path'
import { FabricVersionsLoader } from '../types/meta/fabric/FabricLoader.js'

  const fabricMetaMain: URL = new URL('https://meta.fabricmc.net/')
  const fabricMetaFallback: URL = new URL('https://meta2.fabricmc.net/')
  let fabricMeta: URL

  async function testFabricMetaUrl(testAnyway?: boolean): Promise<void> {
    if (fabricMeta && !testAnyway) return
    const respMain = await ky.head(fabricMetaMain)
    if (respMain.ok) {
      fabricMeta = fabricMetaMain
      return
    }
    const respFallback = await ky.head(fabricMetaFallback)
    if (respFallback.ok) {
      fabricMeta = fabricMetaFallback
      return
    }
    throw 'Both fabric meta servers failed!'
  }

  export async function getFabricLauncherMetaForVersion(versionManifest: VersionManifest, fabricVersion?: string): Promise<FabricLauncherMeta> {
    await testFabricMetaUrl()
    const allLauncherMetas: FabricVersionsLoader[] = await ky.get<FabricLauncherMeta[]>(`${fabricMeta}/v2/versions/loader`).then((res) => res.json())
    fabricVersion = fabricVersion||allLauncherMetas[0].version

    const file: DownloaderFile = {
      url: `${fabricMeta}/v2/versions/loader/${versionManifest.id}/${fabricVersion}`,
      dir: path.resolve(gameDir, 'version', versionManifest.id),
      name: `fabric-${fabricVersion}.json`
    }
    const opts: DownloaderOpts = {
      getContent: true
    }
    return dl.downloadSingleFile<FabricLauncherMeta>(file, opts)
  }
