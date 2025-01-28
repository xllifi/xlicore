import { DownloadProgress } from 'ky'

export type DownloaderFile = {
  url: string
  dir: string
  name?: string
  size?: number
  verify?: DownloaderVerify
  type: 'assets' | 'libraries' | 'java' | 'modpack' | 'meta' | 'loader' | 'game'
}

export type DownloaderCallbackOnProgress = (progress: DownloadProgress, chunk: Uint8Array, file: DownloaderFile, lastProgress: DownloaderLastProgress) => void
export type DownloaderCallbackOnFinish = (file: DownloaderFile, lastProgress: DownloaderLastProgress, totalPercent?: number) => void

export type DownloaderOpts = {
  onDownloadProgress?: DownloaderCallbackOnProgress
  onDownloadFinish?: DownloaderCallbackOnFinish
  overwrite?: boolean
  getContent?: boolean
  totalSize?: number
}

export type DownloaderVerify = {
  /** Hash string */
  hash: string
  /** Hash algorithm. Accepts only SHA1 or SHA256 */
  algorithm: 'sha1' | 'sha256' // todo add more algorithms if needed
  /** Used internally for limiting to only one retry download. Set to true if you don't want to retry downloads */
  noDlRetry?: boolean
}

export type DownloaderLastProgress = {
  timestamp: number
  bytes: number
}
