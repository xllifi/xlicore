import ky from 'ky'
import fs from 'fs'
import type { DownloaderFile } from '../types/utils/Downloader.js'
import type { TemurinMeta } from '../types/meta/java/TemurinMeta.ts'
import path from 'path'
import extract from 'extract-zip'
import { Launch } from '../launch.js'
import { VersionManifest } from '../types/meta/minecraft/VersionManifest.js'

const osMapping: { [key: string]: string } = { win32: 'windows', linux: 'linux', darwin: 'mac' }
const archMapping: { [key: string]: string } = { x64: 'x64', ia32: 'x86', arm64: 'aarch64', arm: 'arm' }

export async function downloadJava(launch: Launch, versionManifest: VersionManifest): Promise<string> {
  const os = osMapping[process.platform]
  const arch = archMapping[process.arch]

  const majorVersion: number = versionManifest.javaVersion.majorVersion
  const temurinMeta: TemurinMeta = (await ky.get<TemurinMeta[]>(`https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot?image_type=jre&architecture=${arch}&os=${os}`).json())[0]
  const file: DownloaderFile = {
    url: temurinMeta.binary.package.link,
    dir: path.resolve(launch.opts.rootDir, 'java', temurinMeta.release_name + '-' + temurinMeta.binary.image_type),
    name: `${temurinMeta.release_name + '-' + temurinMeta.binary.image_type}.zip`,
    type: 'java',
    size: temurinMeta.binary.package.size,
    verify: {
      hash: temurinMeta.binary.package.checksum,
      algorithm: 'sha256'
    }
  }

  const javaExePath: string = path.resolve(file.dir, 'bin/java.exe')
  if (fs.existsSync(javaExePath)) {
    return javaExePath
  }

  const dest = path.resolve(file.dir, file.name!)
  await launch.dl.downloadSingleFile(file)

  // console.log(`[Java DL] Extracting ${dest} to ${path.dirname(file.dir)}`)
  await extract(dest, { dir: path.dirname(file.dir) })

  // console.log(`[Java DL] Deleting ${dest}`)
  fs.rmSync(dest)

  return javaExePath
}
