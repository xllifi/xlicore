import { DownloadProgress } from "ky"

export type DownloaderFile = {
  url: string
  dir: string
  name?: string
  size?: number
}

export type DownloaderCallbackOnDownload = (progress: DownloadProgress, chunk: Uint8Array, file: DownloaderFile) => void
export type DownloaderCallbackOnFinish = (file: DownloaderFile) => void

export type DownloaderOpts = {
  onDownloadProgress?: DownloaderCallbackOnDownload
  onDownloadFinish?: DownloaderCallbackOnFinish
  overwrite?: boolean
  getContent?: boolean
  verify?: DownloaderVerify
}

export type DownloaderVerify = {
  hash: string
  algorithm: 'sha1' | 'sha256' // todo add more algorithms if needed
  noRetry?: boolean
}
