import { DownloadProgress } from 'ky'

export type DownloaderFile = {
  url: string
  dir: string
  name?: string
  size?: number
  verify?: DownloaderVerify
  type?: 'assets' | 'libraries' | 'java'
}

export type DownloaderCallbackOnProgress = (progress: DownloadProgress, chunk: Uint8Array, file: DownloaderFile, lastProgress: DownloaderLastProgress) => void
export type DownloaderCallbackOnFinish = (file: DownloaderFile) => void

export type DownloaderOpts = {
  onDownloadProgress?: DownloaderCallbackOnProgress
  onDownloadFinish?: DownloaderCallbackOnFinish
  overwrite?: boolean
  getContent?: boolean
}

export type DownloaderVerify = {
  hash: string
  algorithm: 'sha1' | 'sha256' // todo add more algorithms if needed
  noRetry?: boolean
}

export type DownloaderLastProgress = {
  timestamp: number
  bytes: number
}
