import { Launch } from "../../launch.js";
import { LaunchOpts } from "../../types/Launch.js";
// import { MrpackMeta } from "../../types/meta/mrpack/MrpackMeta.js";
import { DownloaderFile } from "../../types/utils/Downloader.js";
import { getUrlFilename } from "../../utils/downloader.js";
import fs from 'fs'
import fse from 'fs-extra'
import fsp from 'fs/promises'
import path from "path";
import extract from "extract-zip";
import { MrpackMeta } from "../../types/meta/mrpack/MrpackMeta.js";

export async function parseMrpack(launch: Launch, opts: LaunchOpts): Promise<void> {
  if (!opts.mrpack) return
  if (!URL.canParse(opts.mrpack?.link)) throw `Invald URL: ${opts.mrpack?.link}`

  const file: DownloaderFile = {
    url: opts.mrpack?.link,
    dir: launch.instancePath,
    name: getUrlFilename(opts.mrpack?.link),
    type: 'modpack',
    verify: opts.mrpack.verify ? { hash: opts.mrpack.verify.hash, algorithm: opts.mrpack.verify.algorithm } : undefined
  }
  await launch.dl.downloadSingleFile(file)

  const dest = path.resolve(file.dir, file.name!)
  // console.log(`[MrpackDL] Extracting ${dest} to ${path.dirname(launch.instancePath)}`)
  await extract(dest, { dir: file.dir })

  // console.log(`[MrpackDL] Deleting ${dest}`)
  fs.unlinkSync(dest)
  await fse.move(path.resolve(launch.instancePath, 'overrides'), launch.instancePath, console.error)

  const mrpackMeta: MrpackMeta = await fsp.readFile(path.resolve(file.dir, 'modrinth.index.json'), {encoding: 'utf8'}).then((res) => JSON.parse(res))

  const totalSize = Object.values(mrpackMeta.files)
  .map((x) => x.fileSize)
  .reduce((pV, x) => (pV += x))

  const dlFiles: DownloaderFile[] = []
  for (const file of mrpackMeta.files) {
    if (file.env?.client == 'unsupported') continue

    const dest = path.resolve(launch.instancePath, file.path)
    const dlFile: DownloaderFile = {
      url: file.downloads[0],
      dir: path.dirname(dest),
      name: path.basename(dest),
      size: totalSize,
      type: 'modpack',
      verify: {
        hash: file.hashes.sha1,
        algorithm: 'sha1'
      }
    }
    dlFiles.push(dlFile)
  }
  await launch.dl.downloadMultipleFiles(dlFiles)
}
