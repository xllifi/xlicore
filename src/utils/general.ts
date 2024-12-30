import { DownloadProgress } from 'ky'
import type { DownloaderLastProgress } from '../types/utils/Downloader.js'
import fsp from 'fs/promises'
import path from 'path'

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
  return [...new Map(arr.map((item) => [item[key], item])).values()]
}

export async function mvDir(srcDir: string, destDir: string): Promise<void> {
  const filenames: string[] = (await fsp.readdir(srcDir, { recursive: true })).reverse()
  console.log(`Moving files: ${filenames}`)
  await Promise.all(
    filenames.map(async (x) => {
      // console.log(`Moving file: ${x}`)
      const stat = await fsp.stat(path.resolve(srcDir, x))
      if (stat.isFile()) {
        await fsp.cp(path.resolve(srcDir, x), path.resolve(destDir, x), { recursive: true })
        await fsp.unlink(path.resolve(srcDir, x))
      }
    })
  ).then(async () => {
    await fsp.rmdir(srcDir, { recursive: true })
  })
}

export async function genDirs(rootDir: string): Promise<void> {
  const dirs: string[] = [
    path.resolve(rootDir, 'instance'),
    path.resolve(rootDir, 'libraries'),
    path.resolve(rootDir, 'version'),
    path.resolve(rootDir, 'assets')
  ]
  await Promise.all(
    dirs.map((x) => {
      fsp.mkdir(x, { recursive: true })
    })
  )
  return
}
