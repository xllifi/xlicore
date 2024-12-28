import { Launch } from '../launch.js'
import type { GameLaunchArguments } from '../types/Launch.ts'
import { VersionManifest, VersionManifestGameArgumentsRule, VersionManifestJvmArgumentsRule } from '../types/meta/minecraft/VersionManifest.js'
import { mojangArchMapping, mojangOsMapping } from '../utils/general.js'

export function buildArguments(launch: Launch, versionManifest: VersionManifest): GameLaunchArguments {
  let jvm: string[] = []
  let game: string[] = []

  // Manifested arguments
  jvmArgLoop: for (const jvmArg of versionManifest.arguments.jvm) {
    if (isRuledJvmArgument(jvmArg)) {
      for (const rule of jvmArg.rules) {
        if ((rule.os.arch && rule.os.arch != mojangArchMapping[process.arch]) || (rule.os.name && rule.os.name != mojangOsMapping[process.platform])) {
          console.error(
            `Not adding argument ${jvmArg.value} because it was made for ${rule.os.name} (${rule.os.arch}) and we're running ${mojangOsMapping[process.platform]} (${mojangArchMapping[process.arch]})`
          )
          continue jvmArgLoop
        }
      }
      if (Array.isArray(jvmArg.value)) {
        jvm.push(...jvmArg.value)
      } else {
        jvm.push(jvmArg.value)
      }
      continue jvmArgLoop
    }
    jvm.push(jvmArg)
  }
  gameArgLoop: for (const gameArg of versionManifest.arguments.game) {
    if (isRuledGameArgument(gameArg)) continue gameArgLoop
    game.push(gameArg)
  }

  // Custom JVM arguments
  if (launch.opts.gameOpts?.memory) {
    jvm.push(`-Xms${launch.opts.gameOpts.memory.min}M`)
    jvm.push(`-Xmx${launch.opts.gameOpts.memory.max}M`)
  }
  if (launch.opts.auth.drasl) {
    jvm.push(`-Dminecraft.api.env=custom`)
    jvm.push(`-Dminecraft.api.auth.host=${launch.opts.auth.drasl.server}/auth`)
    jvm.push(`-Dminecraft.api.account.host=${launch.opts.auth.drasl.server}/account`)
    jvm.push(`-Dminecraft.api.session.host=${launch.opts.auth.drasl.server}/session`)
    jvm.push(`-Dminecraft.api.services.host=${launch.opts.auth.drasl.server}/services`)
    if (launch.authlibInjectorPath) jvm.push(`-javaagent:${launch.authlibInjectorPath}=${launch.opts.auth.drasl.server}/authlib-injector`)
  }
  // Custom game arguments
  if (launch.opts.gameOpts?.screen) {
    game.push(`--width ${launch.opts.gameOpts?.screen.width}`)
    game.push(`--height ${launch.opts.gameOpts?.screen.height}`)
  }

  // Argument maps
  const jvmArgMap: { [key: string]: string } = {
    '-Dminecraft.launcher.brand=${launcher_name}': `-Dminecraft.launcher.brand=${launch.opts.launcher?.name || 'xlicore'}`,
    '-Dminecraft.launcher.version=${launcher_version}': `-Dminecraft.launcher.version=${launch.opts.launcher?.name || 'unknown'}`,
    '-Djava.library.path=${natives_directory}': '',
    '-Djna.tmpdir=${natives_directory}': '',
    '-Dorg.lwjgl.system.SharedLibraryExtractPath=${natives_directory}': '',
    '-Dio.netty.native.workdir=${natives_directory}': '',
    '-cp': '',
    '${classpath}': ''
  }
  const gameArgMap: { [key: string]: string } = {
    '${version_name}': launch.opts.version,
    '${version_type}': launch.versionManifest.type,
    '${game_directory}': launch.instancePath,
    '${assets_root}': launch.assetPath,
    '${assets_index_name}': launch.versionManifest.assetIndex.id,
    '${user_type}': launch.opts.auth.userType,
    '${auth_player_name}': launch.opts.auth.name,
    '${auth_uuid}': launch.opts.auth.uuid || '',
    '${auth_access_token}': launch.opts.auth.accessToken || '',
    '${clientid}': launch.opts.auth.clientId || '',

    '--clientId': launch.opts.auth.clientId ? '--clientId' : '',
    '--accessToken': launch.opts.auth.accessToken ? '--accessToken' : '',
    '--uuid': launch.opts.auth.uuid ? '--uuid' : '',
    '--xuid': '',
    '${auth_xuid}': ''
  }

  // Use argument maps to assign correct values
  for (const arg in jvm) {
    if (Object.keys(jvmArgMap).includes(jvm[arg])) jvm[arg] = jvmArgMap[jvm[arg]]
  }
  for (const arg in game) {
    if (Object.keys(gameArgMap).includes(game[arg])) game[arg] = gameArgMap[game[arg]]
  }
  // Strip zero-length entries
  jvm = jvm.filter((x) => x.length > 0)
  game = game.filter((x) => x.length > 0)

  return {
    jvm,
    game
  }
}

function isRuledJvmArgument(arg: string | VersionManifestJvmArgumentsRule): arg is VersionManifestJvmArgumentsRule {
  const argRule = (arg as VersionManifestJvmArgumentsRule).rules
  if (!argRule) return false
  return argRule[0].os !== undefined
}
function isRuledGameArgument(arg: string | VersionManifestGameArgumentsRule): arg is VersionManifestGameArgumentsRule {
  const argRule = (arg as VersionManifestGameArgumentsRule).rules
  if (!argRule) return false
  return argRule[0].features !== undefined
}
