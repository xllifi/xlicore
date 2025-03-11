import { launchCredentials } from './meta/auth/launchCredentials.js'
import { DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderVerify } from './utils/Downloader.js'

export type LaunchOpts = {
  auth: launchCredentials
  useAuthlib: boolean
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
    dlOnProgress?: DownloaderCallbackOnProgress
    dlOnFinish?: DownloaderCallbackOnFinish
    gameOnStart?: (pid: number | null) => void
    gameOnExit?: (pid: number | null, exitcode: number | null) => void
    gameOnLogs?: (data: string) => void
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
    /** Should the game be detached from launcher */
    detached?: boolean
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
