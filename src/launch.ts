import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

import { buildArguments } from './arguments/minecraft.js';
import { downloadAuthlib } from './auth/authlib.js';
import { downloadAssets } from './download/assets.js';
import { downloadJava } from './download/javaTemurin.js';
import { downloadFabricLibraries } from './download/libraries/fabric.js';
import { downloadMinecraftLibraries } from './download/libraries/minecraft.js';
import { parseMrpack } from './download/modpack/parseMrpack.js';
import { getFabricLauncherMetaForVersion } from './download/meta/fabric.js';
import { getVersionManifest } from './download/meta/minecraft.js';
import { Downloader } from './utils/downloader.js';

import type { GameLaunchArguments, LaunchOpts } from './types/Launch.ts'
import type { FabricLauncherMeta } from './types/meta/fabric/FabricLauncherMeta.ts'
import type { VersionManifest } from './types/meta/minecraft/VersionManifest.ts'

export class Launch {
  dl: Downloader
  opts: LaunchOpts

  versionManifest: VersionManifest = {} as VersionManifest
  fabricMeta: FabricLauncherMeta = {} as FabricLauncherMeta
  arguments: GameLaunchArguments = {} as GameLaunchArguments

  classpath: string[] = []
  javaExePath: string = ''
  assetPath: string = ''
  instancePath: string = ''
  authlibInjectorPath: string | null = null

  constructor(opts: LaunchOpts) {
    this.opts = opts
    this.dl = new Downloader(undefined, {
      onDownloadProgress: opts.callbacks?.dlOnProgress,
      onDownloadFinish: opts.callbacks?.dlOnFinish
    })
  }

  /**
   * returns subprocess
   */
  async start(): Promise<ChildProcessWithoutNullStreams> {
    this.instancePath = path.resolve(this.opts.rootDir, 'instance')
    if (!fs.existsSync(this.instancePath)) await fsp.mkdir(this.instancePath, { recursive: true })

    this.versionManifest = await getVersionManifest(this, this.opts.version)
    this.fabricMeta = await getFabricLauncherMetaForVersion(this, this.versionManifest)

    // Download
    const fabricCP = await downloadFabricLibraries(this, this.fabricMeta)
    const minecraftCP = await downloadMinecraftLibraries(this, this.versionManifest)
    this.classpath = [...fabricCP, ...minecraftCP]
    this.javaExePath = await downloadJava(this, this.versionManifest)
    this.assetPath = await downloadAssets(this, this.versionManifest)
    await parseMrpack(this, this.opts)

    // Auth
    if (this.opts.useAuthlib) this.authlibInjectorPath = await downloadAuthlib(this)

    // Arguments
    this.arguments = await buildArguments(this, this.versionManifest)
    console.log(`[launch.ts] JVM Arguments: ${JSON.stringify(this.arguments.jvm)}`)
    // console.log(`[launch.ts] Classpath: -cp ${this.classpath}`)
    console.log(`[launch.ts] Main class: ${this.fabricMeta.launcherMeta.mainClass.client}`)
    console.log(`[launch.ts] Game Arguments: ${JSON.stringify(this.arguments.game)}`)

    const subprocess: ChildProcessWithoutNullStreams = this.createProcess()

    subprocess.stdout.setEncoding('utf8')
    // subprocess.stdout.on('data', (data: Buffer) => console.log('[MC LOGS] ' + data.toString().replace(/\n$/, '')))
    subprocess.stderr.setEncoding('utf8')
    // subprocess.stderr.on('data', (data) => console.error('[MC LOGS] ' + data.toString().replace(/\n$/, '')))

    if (this.opts.callbacks?.gameOnExit) subprocess.on('exit', () => { this.opts.callbacks!.gameOnExit!(subprocess.pid || null) })
    if (this.opts.callbacks?.gameOnLogs) subprocess.stdout.on('data', (data: Buffer) => {this.opts.callbacks!.gameOnLogs!(data.toString().replace(/\n$/, ''))})
    if (this.opts.callbacks?.gameOnLogs) subprocess.stderr.on('data', (data: Buffer) => {this.opts.callbacks!.gameOnLogs!(data.toString().replace(/\n$/, ''))})
    if (this.opts.callbacks?.gameOnError) subprocess.on('error', this.opts.callbacks.gameOnError)

    return subprocess
  }

  private createProcess(): ChildProcessWithoutNullStreams {
    const mcprocess = spawn(
      this.javaExePath,
      [
        ...this.arguments.jvm,
        `-cp`, this.classpath.join(';'),
        this.fabricMeta.launcherMeta.mainClass.client,
        ...this.arguments.game
      ],
      { cwd: this.instancePath, detached: this.opts.gameOpts?.detached }
    )
    if (this.opts.callbacks?.gameOnStart) this.opts.callbacks.gameOnStart(mcprocess.pid || null)
    return mcprocess
  }
}
