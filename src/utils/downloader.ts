import ky from 'ky'
import * as fs from 'fs'
import * as dlt from '../types/utils/Downloader.js'
import path from 'path'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import crypto from 'crypto'

export class Downloader {
  tempSuffix: string
  generalOpts: dlt.DownloaderOpts

  constructor(tempSuffix?: string, generalOpts?: dlt.DownloaderOpts) {
    this.tempSuffix = tempSuffix || '.temp'
    this.generalOpts = generalOpts || {}
  }

  async downloadSingleFile<T>(file: dlt.DownloaderFile, opts: dlt.DownloaderOpts = {}): Promise<T> {
    opts = {...this.generalOpts, ...opts}
    file.dir = path.resolve(file.dir)

    if (!URL.canParse(file.url)) throw `Invald URL: ${file.url}`

    if (file.name == null) file.name = file.url.split('/').pop()
    if (!opts.onDownloadProgress) opts.onDownloadProgress = (progress) => console.log(`Downloading ${file.url}. Progress: ${progress.percent * 100} (${progress.transferredBytes}/${progress.totalBytes})`)
    if (!opts.onDownloadFinish) opts.onDownloadFinish = () => console.log(`Finished downloading ${file.url}`)

    const dest: string = path.resolve(file.dir, file.name!)
    if (!fs.existsSync(file.dir)) fs.mkdirSync(file.dir, { recursive: true })
    if (fs.existsSync(dest) && !opts.overwrite) throw `File ${dest} already exists`

    const resp = await ky(file.url, {
      method: 'get',
      onDownloadProgress: (progress, chunk) => {
        if (file.size && progress.totalBytes == 0) {
          progress.totalBytes = file.size
          progress.percent = progress.transferredBytes / progress.totalBytes
        }
        opts.onDownloadProgress!(progress, chunk, file)
      }
    })

    return new Promise<T>((resolve, reject) => {
      const writeStream: fs.WriteStream = fs.createWriteStream(dest + this.tempSuffix)
      const readableStream: Readable = Readable.fromWeb(resp.body! as ReadableStream)
      readableStream.pipe(writeStream)

      if (opts.verify) {
        readableStream.on('end', async () => {
          if (!await this.verifyFile(dest, opts.verify!)) {
            if (!opts.verify!.noRetry) {
              return this.downloadSingleFile(file, {...opts, overwrite: true, verify: {...opts.verify!, noRetry: true}})
            } else {
              fs.unlinkSync(dest)
              throw `Failed to verify file ${dest}`
            }
          }
        })
      }

      if (opts.getContent) {
        let result = ''
        readableStream.on('data', (chunk) => result += chunk)
        readableStream.on('end', () => resolve(JSON.parse(result)))
      }

      readableStream.on('end', () => {
        opts.onDownloadFinish!(file)
        writeStream.close()
        fs.renameSync(dest + this.tempSuffix, dest)
      })
      readableStream.on('error', (err) => reject(err))
    })
  }

  async downloadMultipleFiles(files: dlt.DownloaderFile[], opts: dlt.DownloaderOpts = {}) {
    opts = {...this.generalOpts, ...opts}
    const errs: Error[] = [];
    for (const file of files) {
      this.downloadSingleFile(file, opts)
      .catch((err) => errs.push(err))
    }
    if (errs.length > 0) {
      throw errs
    }
  }

  async verifyFile(dest: string, data: dlt.DownloaderVerify): Promise<boolean> {
    const currentHash: string = await this.getHash(dest, data.algorithm)
    if (currentHash != data.hash) return false
    return true
  }
  private getHash(dest: string, algorithm: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash(algorithm)
      const readStream = fs.createReadStream(dest, {encoding: 'utf8'})

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
