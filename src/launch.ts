import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import path from 'path'
import { downloadJava } from './download/javaTemurin.js'
import { downloadFabricLibraries } from './download/libraries/fabric.js'
import { downloadMinecraftLibraries } from './download/libraries/minecraft.js'
import { getFabricLauncherMetaForVersion } from './meta/fabric.js'
import { getVersionManifest } from './meta/minecraft.js'
import { GameLaunchArguments, LaunchOpts } from './types/Launch.js'
import { FabricLauncherMeta } from './types/meta/fabric/FabricLauncherMeta.js'
import { Downloader } from './utils/downloader.js'
import { existsSync, mkdirSync } from 'fs'
import { downloadAssets } from './download/assets.js'
import { buildArguments } from './arguments/minecraft.js'

export class Launch {
  dl: Downloader
  opts: LaunchOpts

  versionManifest: VersionManifest = {} as VersionManifest
  fabricMeta: FabricLauncherMeta   = {} as FabricLauncherMeta
  arguments: GameLaunchArguments   = {} as GameLaunchArguments

  classpath: string   = ''
  javaExePath: string = ''
  assetPath: string   = ''
  instancePath: string   = ''

  constructor(opts: LaunchOpts) {
    this.opts = opts
    this.dl = new Downloader(undefined, {
      onDownloadProgress: opts.download?.onProgress,
      onDownloadFinish: opts.download?.onFinish
    })
  }

  async start(): Promise<void> {
    this.versionManifest = await getVersionManifest(this, this.opts.version)
    this.fabricMeta      = await getFabricLauncherMetaForVersion(this, this.versionManifest)

    // Create instance directory
    this.instancePath = path.resolve(this.opts.rootDir, 'instance')
    if (!existsSync(this.instancePath)) mkdirSync(this.instancePath, { recursive: true })

    // Download
    const fabricCP    = await downloadFabricLibraries(this, this.fabricMeta)
    const minecraftCP = await downloadMinecraftLibraries(this, this.versionManifest)
    this.classpath    = [...fabricCP, ...minecraftCP].join(';')
    this.javaExePath  = await downloadJava(this, this.versionManifest)
    this.assetPath    = await downloadAssets(this, this.versionManifest)
    this.arguments    = await buildArguments(this, this.versionManifest)

    console.log(`[launch.ts] JVM Arguments: ${JSON.stringify(this.arguments.jvm)}`)
    // console.log(`[launch.ts] Classpath: -cp ${this.classpath}`)
    console.log(`[launch.ts] Main class: ${this.fabricMeta.launcherMeta.mainClass.client}`)
    console.log(`[launch.ts] Game Arguments: ${JSON.stringify(this.arguments.game)}`)

    const subprocess: ChildProcessWithoutNullStreams = this.createProcess()

    subprocess.stdout.setEncoding('utf8')
    subprocess.stdout.on('data', (data: Buffer) => console.log('[MC LOGS] ' + data.toString().replace(/\n$/, '')))
    subprocess.stderr.setEncoding('utf8')
    subprocess.stderr.on('data', (data) => console.error('[MC LOGS] ' + data))
  }

  private createProcess(): ChildProcessWithoutNullStreams {
    return spawn(
      this.javaExePath,
      [
        ...this.arguments.jvm,
        `-cp`,
        this.classpath,
        this.fabricMeta.launcherMeta.mainClass.client,
        ...this.arguments.game
      ],
      { cwd: this.instancePath }
    )
  }
}

