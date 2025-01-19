import { Launch } from '../../launch.js'
import type { LaunchOpts } from '../../types/Launch.ts'
import type { MrpackMeta } from '../../types/meta/mrpack/MrpackMeta.ts'
import type { DownloaderFile } from '../../types/utils/Downloader.js'
import { getUrlFilename } from '../../utils/downloader.js'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import extract from 'extract-zip'
import { mvDir, splitArray } from '../../utils/general.js'
import { createHash } from 'crypto'

async function deleteByOldMeta(launch: Launch, oldmeta: MrpackMeta) {
  const overridesMeta: cachedFile[] | null = await fsp
    .readFile(path.resolve(launch.instancePath, 'overrides.json'), { encoding: 'utf8' })
    .then((res) => JSON.parse(res))
    .catch(() => null)

  let filteredOverridesMeta: cachedFile[] = []

  if (overridesMeta) {
    filteredOverridesMeta = overridesMeta.filter(async (file) => {
      const content = await fsp.readFile(file.path, { encoding: 'utf8' })
      const hashMaker = createHash('sha1')
      hashMaker.update(content)
      const sha1 = hashMaker.digest('hex')
      return sha1 !== file.sha1
    })
  }

  const mods: cachedFile[] = oldmeta.files.map((file) => ({ path: path.resolve(launch.instancePath, file.path), sha1: file.hashes.sha1 }))

  const files = [...mods, ...filteredOverridesMeta]

  const chunks = files.length > 64 ? splitArray(files.length / 64, files) : [files]
  for (const chunk of chunks) {
    await Promise.all(chunk.map(file => {
      console.log(`Removing file ${file.path}`)
      fsp.unlink(file.path)
    }))
  }
}

export async function parseMrpack(launch: Launch, opts: LaunchOpts): Promise<void> {
  let oldmeta: null | MrpackMeta = null
  if (fs.existsSync(path.resolve(launch.instancePath, 'modrinth.index.json')) && !fs.existsSync(path.resolve(launch.instancePath, 'overrides'))) {
    oldmeta = await fsp.readFile(path.resolve(launch.instancePath, 'modrinth.index.json'), { encoding: 'utf8' }).then((res) => JSON.parse(res))
  }

  if (!opts.mrpack) {
    if (oldmeta) await deleteByOldMeta(launch, oldmeta)
    fsp.unlink(path.resolve(launch.instancePath, 'modrinth.index.json'))
    return
  }

  if (!URL.canParse(opts.mrpack?.url)) throw new Error(`Invald URL: ${opts.mrpack?.url}`)

  const file: DownloaderFile = {
    url: opts.mrpack?.url,
    dir: launch.instancePath,
    name: getUrlFilename(opts.mrpack?.url),
    type: 'modpack',
    verify: opts.mrpack.verify ? { hash: opts.mrpack.verify.hash, algorithm: opts.mrpack.verify.algorithm } : undefined
  }
  await launch.dl.downloadSingleFile(file)

  // Extract
  const dest = path.resolve(file.dir, file.name!)
  console.log(`Extracting and deleting ${dest}`)
  await extract(dest, { dir: file.dir })
  fs.unlinkSync(dest)

  const mrpackMeta: MrpackMeta = await fsp.readFile(path.resolve(file.dir, 'modrinth.index.json'), { encoding: 'utf8' }).then((res) => JSON.parse(res))

  // Remove old files
  if (oldmeta) {
    if (mrpackMeta.name === oldmeta.name && mrpackMeta.versionId === oldmeta.versionId) return
    await deleteByOldMeta(launch, oldmeta)
  }

  // Cache new files
  const cachedFiles: cachedFile[] = []
  await mvDir(path.resolve(launch.instancePath, 'overrides'), launch.instancePath, {
    fileAfterCopy(path) {
      const hashMaker = createHash('sha1')
      hashMaker.update(fs.readFileSync(path, { encoding: 'utf8' }))
      const sha1 = hashMaker.digest('hex')
      const file: cachedFile = { path, sha1 }
      cachedFiles.push(file)
    }
  })
  console.log(cachedFiles)
  await fsp.writeFile(path.resolve(launch.instancePath, 'overrides.json'), JSON.stringify(cachedFiles))

  const dlFiles: DownloaderFile[] = []
  for (const file of mrpackMeta.files) {
    if (file.env?.client == 'unsupported') continue

    const dest = path.resolve(launch.instancePath, file.path)
    const dlFile: DownloaderFile = {
      url: file.downloads[0],
      dir: path.dirname(dest),
      name: path.basename(dest),
      type: 'modpack',
      verify: {
        hash: file.hashes.sha1,
        algorithm: 'sha1'
      }
    }
    dlFiles.push(dlFile)
  }
  await launch.dl.downloadMultipleFiles(dlFiles, {
    totalSize: Object.values(mrpackMeta.files)
      .map((x) => x.fileSize)
      .reduce((pV, x) => (pV += x))
  })
}

type cachedFile = {
  path: string
  sha1: string
}
