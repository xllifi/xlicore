import ky from 'ky'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import type * as dlt from '../types/utils/Downloader.js'
import path from 'path'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import crypto from 'crypto'
import { splitArray } from './general.js'

export class Downloader {
  tempSuffix: string
  generalOpts: dlt.DownloaderOpts

  constructor(tempSuffix?: string, generalOpts?: dlt.DownloaderOpts) {
    this.tempSuffix = tempSuffix || '.temp'
    this.generalOpts = generalOpts || {}
  }

  async downloadSingleFile<T>(file: dlt.DownloaderFile, opts: dlt.DownloaderOpts = {}): Promise<T | null> {
    opts = { ...this.generalOpts, ...opts }
    file.dir = path.resolve(file.dir)

    // Verify variables
    if (!URL.canParse(file.url)) throw new Error(`Invald URL: ${file.url}`)
    if (!file.name) file.name = getUrlFilename(file.url)
    if (!file.size) {
      console.warn(`No file size, getting from HEAD request`)
      const clHeader = await ky.head(file.url).then(res => res.headers.get('content-length')).catch(() => '0')
      if (clHeader) file.size = parseInt(clHeader)
    }
    if (!opts.onDownloadProgress)
      opts.onDownloadProgress = (progress) =>
        console.log(`[SINDL] Downloading ${file.name}${file.type ? ` (${file.type})` : ''}. Progress: ${(progress.percent * 100).toFixed(2)}% (${progress.transferredBytes}/${progress.totalBytes})`)
    if (!opts.onDownloadFinish) opts.onDownloadFinish = () => console.log(`[SINDL] Finished downloading ${file.name}`)

    const dest: string = path.resolve(file.dir, file.name!)
    // Ensure dir exists
    if (!fs.existsSync(file.dir)) fs.mkdirSync(file.dir, { recursive: true })
    // Does file already exist
    if (fs.existsSync(dest) && !opts.overwrite) {
      if (opts.getContent) {
        return JSON.parse(fs.readFileSync(dest, { encoding: 'utf8' }))
      }
      return null
    }

    // Create request
    const lastProgress: dlt.DownloaderLastProgress = { bytes: 0, timestamp: 0 }
    const resp = await ky(file.url, {
      method: 'get',
      onDownloadProgress: (progress, chunk) => {
        if (file.size) {
          progress.totalBytes = file.size
          progress.percent = progress.transferredBytes / progress.totalBytes
        }
        opts.onDownloadProgress!(progress, chunk, file, lastProgress)

        lastProgress.timestamp = Date.now()
        lastProgress.bytes = progress.transferredBytes
      }
    })

    // Write to file
    return new Promise<T | null>((resolve, reject) => {
      const writeStream: fs.WriteStream = fs.createWriteStream(dest + this.tempSuffix)
      const readableStream: Readable = Readable.fromWeb(resp.body! as ReadableStream)
      readableStream.pipe(writeStream)

      // Optional listeners
      if (opts.getContent) {
        let result = ''
        readableStream.on('data', (chunk) => (result += chunk))
        readableStream.on('end', () => resolve(JSON.parse(result)))
      }

      // Main listeners
      readableStream.on('end', () => {
        writeStream.close()
        writeStream.on('finish', async () => {
          await fsp.rename(dest + this.tempSuffix, dest).catch((err) => {
            if (!fs.existsSync(dest)) throw err
            console.error(err)
          })

          if (file.verify) {
            resolve(this.verifyFile(file, lastProgress, opts))
          } else {
            opts.onDownloadFinish!(file, lastProgress)
          }
          resolve(null)
        })
      })
      readableStream.on('error', (err) => reject(err))
    })
  }

  async downloadMultipleFiles(files: dlt.DownloaderFile[], opts: dlt.DownloaderOpts = {}): Promise<void> {
    opts = { ...this.generalOpts, ...opts}

    if (opts.totalSize) {
      console.log(`Has totalSize, doing progress calculations`)

      const userProgressCb = opts.onDownloadProgress
      const userFinishCb = opts.onDownloadFinish
      const totalSize: number = opts.totalSize

      let totalDownloadedBytes: number = 0
      let totalPercent: number = totalDownloadedBytes / opts.totalSize
      function calcPercent() {
        totalPercent = totalDownloadedBytes / totalSize
      }

      opts = {
        ...opts,
        onDownloadProgress(progress, chunk, file, lastProgress) {
          totalDownloadedBytes += progress.transferredBytes - lastProgress.bytes
          calcPercent()

          if (userProgressCb) userProgressCb({ ...progress, percent: totalPercent }, chunk, file, lastProgress)
            else console.log(
              `[MULDL] Total download: ${(totalPercent * 100).toFixed(2)}% (${totalDownloadedBytes}/${totalSize})` +
                (file.type ? ` (${file.type})` : '') +
                ` | Currently downloading ${file.name}`
            )
        },
        onDownloadFinish(file, lastProgress) {
          if (file.size && file.size > 0) totalDownloadedBytes += file.size! - lastProgress.bytes
          calcPercent()

          if (userFinishCb) userFinishCb(file, lastProgress, totalPercent)
            else console.log(
              `[MULDL] Total download: ${(totalPercent * 100).toFixed(2)}% (${totalDownloadedBytes}/${totalSize})` +
                (file.type ? ` (${file.type})` : '') +
                ` | Finished downloading ${file.name}`
            )
        }
      }
    }

    const errs: Error[] = []
    const chunks = files.length > 64 ? splitArray(files.length / 64, files) : [files]

    for (const chunk of chunks) {
      // prettier-ignore
      await Promise.all(
        chunk.map(
          (file) => this.downloadSingleFile(file, opts).catch((err) => errs.push(err))
        )
      )
    }

    if (errs.length > 0) {
      console.log(`[MULDL] ` + JSON.stringify(errs))
      throw new AggregateError(errs)
    }
  }

  async verifyFile<T>(file: dlt.DownloaderFile, lastProgress: dlt.DownloaderLastProgress, opts: dlt.DownloaderOpts): Promise<T | null> {
    const dest: string = path.resolve(file.dir, file.name!)
    const currentHash: string = await this.getHash(dest, file.verify!.algorithm)
    if (currentHash != file.verify!.hash) {
      if (file.verify!.noDlRetry) {
        fs.rmSync(dest)
        throw new Error(`Failed to verify file ${file.name}`)
      }
      return this.downloadSingleFile<T>({ ...file, verify: { ...file.verify!, noDlRetry: true } }, { ...opts, overwrite: true })
    }
    opts.onDownloadFinish!(file, lastProgress)
    return null
  }

  private getHash(dest: string, algorithm: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash(algorithm)
      const readStream = fs.createReadStream(dest)

      readStream.on('data', (chunk) => {
        hash.update(chunk)
      })
      readStream.on('end', () => {
        resolve(hash.digest('hex'))
      })
      readStream.on('err', (err) => {
        reject(err)
      })
    })
  }
}

export function getUrlFilename(url: string): string {
  return url.split('/').pop()!
}
