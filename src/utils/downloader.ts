import ky from 'ky'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as dlt from '../types/utils/Downloader.js'
import path from 'path'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import crypto from 'crypto'
import { sleep, splitArray } from './general.js'

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
    if (!URL.canParse(file.url)) throw `Invald URL: ${file.url}`
    if (file.name == null) file.name = getUrlFilename(file.url)
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
      return this.verifyFile(file, opts)
    }

    // Create request
    const lastProgress: dlt.DownloaderLastProgress = { bytes: 0, timestamp: 0 }
    const resp = await ky(file.url, {
      method: 'get',
      onDownloadProgress: (progress, chunk) => {
        if (lastProgress.timestamp + 250 > Date.now()) return
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
      readableStream.on('end', async () => {
        opts.onDownloadFinish!(file)
        writeStream.close()
        await sleep(250)
        await fsp.rename(dest + this.tempSuffix, dest).catch((err) => {
          if (!fs.existsSync(dest)) throw err
        })

        if (file.verify) {
          resolve(this.verifyFile(file, opts))
        }

        resolve(null)
      })
      readableStream.on('error', (err) => reject(err))
    })
  }

  async downloadMultipleFiles(files: dlt.DownloaderFile[], opts: dlt.DownloaderOpts = {}): Promise<void> {
    opts = { ...this.generalOpts, ...opts }

    // If there's size specified for every file then do total DL
    if (files.filter((x) => x.size).length == files.length) {
      console.log(`Doing total DL`)

      let lastOnProgress: dlt.DownloaderCallbackOnProgress
      if (opts.onDownloadProgress) lastOnProgress = opts.onDownloadProgress

      let currentBytes: number = 0
      opts = {
        ...opts,
        onDownloadProgress: (progress, chunk, file, lastProgress) => {
          currentBytes += progress.transferredBytes - lastProgress.bytes
          progress.percent = currentBytes / progress.totalBytes

          // Don't do MULDL logs if there's a handler already
          if (lastOnProgress) {
            lastOnProgress(progress, chunk, file, lastProgress)
          } else {
            console.log(
              `[MULDL] Total download: ${(progress.percent * 100).toFixed(2)}% (${currentBytes}/${progress.totalBytes})` +
                (file.type ? ` (${file.type})` : '') +
                ` | Currently downloading ${file.name}`
            )
          }
        }
      }
    }
    const errs: Error[] = []

    const chunks = splitArray(files.length / 64, files)

    for (const chunk of chunks) {
      await Promise.all(chunk.map((file) => this.downloadSingleFile(file, opts).catch((err) => errs.push(err))))
    }

    if (errs.length > 0) {
      console.log('[MULDL] ' + errs)
    }
  }

  async verifyFile<T>(file: dlt.DownloaderFile, opts: dlt.DownloaderOpts): Promise<T | null> {
    const dest: string = path.resolve(file.dir, file.name!)
    const currentHash: string = await this.getHash(dest, file.verify!.algorithm)
    if (currentHash != file.verify!.hash) {
      if (file.verify!.noDlRetry) {
        fs.unlinkSync(dest)
        throw `Failed to verify file ${file.name}`
      }
      return this.downloadSingleFile<T>({ ...file, verify: { ...file.verify!, noDlRetry: true } }, { ...opts, overwrite: true })
    }
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
