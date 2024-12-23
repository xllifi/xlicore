import { DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderVerify } from './utils/Downloader.js'

export type LaunchOpts = {
  auth: string // TODO: Make actual auth!
  authserver: string // TODO: same as above
  /** Path to `.minecraft` directory */
  rootDir: string
  /** Minecraft version */
  version: string
  /** Use to specify some fabric version. Fabric will still be downloaded even if you don't specify a version */
  fabric?: {
    version: string
  }
  /** Downloader settings */
  callbacks?: {
    /** Progress callback. Use to track download progresses */
    dlOnProgress?: DownloaderCallbackOnProgress
    /** Finish callback. Use to track download finishes */
    dlOnFinish?: DownloaderCallbackOnFinish
    /** Game start callback */
    gameOnStart?: () => void
    /** Game exit callback */
    gameOnExit?: () => void
    /** Game error callback */
    gameOnError?: (err: Error) => void
  }
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
  /** Launcher data. Optional */
  launcher?: {
    /** Launcher name */
    name: string
    /** Launcher version */
    version: string
  }
  /** `.mrpack` modpack */
  mrpack?: {
    /** Link to `.mrpack` download */
    url: string,
    /** If you want to verify the download */
    verify?: DownloaderVerify
  }
}

export type GameLaunchArguments = {
  jvm: string[]
  game: string[]
}
