import { DownloadProgress } from 'ky'
import type { DownloaderLastProgress } from '../types/utils/Downloader.js'

export const mojangOsMapping: { [key: string]: string } = { win32: 'windows', darwin: 'osx', linux: 'linux' }
export const mojangArchMapping: { [key: string]: string } = { x64: 'x64', ie32: 'x86' }

export function calcSpeed(progress: DownloadProgress, lastProgress: DownloaderLastProgress): number {
  const bytesSinceLast: number = progress.transferredBytes - lastProgress.bytes
  const timeSinceLast: number = Math.round(Date.now()) / 1000 - Math.round(lastProgress.timestamp) / 1000
  console.log(`Calculating speed with progress ${JSON.stringify(progress)} and lastProgress ${JSON.stringify(lastProgress)}`)
  return bytesSinceLast / timeSinceLast
}

/**
 * @param bps bps for Bytes Per Second
 */
export function formatSpeed(bps: number): string {
  const mbps: number = bps / 1000000
  if (mbps > 0) return `${mbps.toFixed(2)}MB/s`
  const kbps: number = bps / 1000
  if (kbps > 0) return `${kbps.toFixed(2)}KB/s`
  return `${bps.toFixed(2)}B/s`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function splitArray<T>(amount: number, array: T[]): T[][] {
  const chunks = []
  const chunkLength = array.length / amount

  for (let i = 0; i < array.length; i += chunkLength) {
    const chunk = array.slice(i, i + chunkLength)
    chunks.push(chunk)
  }
  return chunks
}
export function getUniqueArrayBy<T extends Record<string, unknown>>(arr: Array<T>, key: string): Array<T> {
  return [...new Map(arr.map(item => [item[key], item])).values()]
}
