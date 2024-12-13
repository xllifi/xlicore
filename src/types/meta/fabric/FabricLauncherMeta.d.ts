import { FabricVersionsIntermediary } from "./FabricIntermediary.js"
import { FabricVersionsLoader } from "./FabricLoader.js"

export type FabricLauncherMeta = {
  loader: FabricVersionsLoader
  intermediary: FabricVersionsIntermediary
  launcherMeta: {
    version: number
    min_java_version: number
    libraries: {
      client: FabricLauncherMetaDownload[]
      common: FabricLauncherMetaDownload[]
      server: FabricLauncherMetaDownload[]
      development: FabricLauncherMetaDownload[]
    }
    mainClass: {
      client: string
      server: string
    }
  }
}

type FabricLauncherMetaDownload = {
  name: string
  url: string
  md5: string
  sha1: string
  sha256: string
  sha512: string
  size: number
}
