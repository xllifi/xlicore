import { DownloaderCallbackOnFinish, DownloaderCallbackOnProgress } from './utils/Downloader.js'

export type LaunchOpts = {
  auth: string // TODO: Make actual auth!
  authserver: string // TODO: same as above
  /** Path to `.minecraft` directory */
  rootDir: string
  /** Minecraft version */
  version: string
  /** Fabric settings */
  fabric: {
    /** `null` = latest */
    version: string | null
  }
  /** Downloader settings */
  download?: {
    /** Progress callback. Use to track download progresses. */
    onProgress?: DownloaderCallbackOnProgress
    onFinish?: DownloaderCallbackOnFinish
  }
  /** Verify files on each launch */ //TODO: implement
  verify: boolean
  /** Minecraft options */
  gameOpts?: {
    /** Window settings */
    screen?: {
      /** Window width */
      width: number
      /** Window height */
      height: number
    }
    /** RAM settings */
    memory?: {
      /** Min (init) RAM */
      min: number
      /** Max RAM */
      max: number
    }
  }
  /** Launcher data. Optional. */
  launcher?: {
    /** Launcher name */
    name: string
    /** Launcher version */
    version: string
  }
}

export type GameLaunchArguments = {
  jvm: string[]
  game: string[]
}
