import { Launch } from '../launch.js'
import { GameLaunchArguments } from '../types/Launch.js'
import { mojangArchMapping, mojangOsMapping } from '../utils/general.js'

export function buildArguments(launch: Launch, versionManifest: VersionManifest): GameLaunchArguments {
  let jvm: string[] = []
  let game: string[] = []

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
  if (launch.opts.gameOpts?.screen) {
    game.push(`--width ${launch.opts.gameOpts?.screen.width}`)
    game.push(`--height ${launch.opts.gameOpts?.screen.height}`)
  }
  if (launch.opts.gameOpts?.memory) {
    jvm.push(`-Xms${launch.opts.gameOpts.memory.min}M`)
    jvm.push(`-Xmx${launch.opts.gameOpts.memory.max}M`)
  }

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
    '${game_directory}': launch.instancePath,
    '${assets_root}': launch.assetPath,
    '${assets_index_name}': launch.versionManifest.assetIndex.id,
    '${auth_uuid}': '', //TODO: actual auth
    '${auth_player_name}': 'xllifi', //TODO: same as above
    '${auth_access_token}': '0', //TODO: same as above
    '${clientid}': '', //TODO: same as above
    '${user_type}': 'Mojang',
    '${version_type}': launch.versionManifest.type,

    '--uuid': '',
    '--clientId': '',
    '--xuid': ''
  }

  for (const arg in jvm) {
    if (Object.keys(jvmArgMap).includes(jvm[arg])) jvm[arg] = jvmArgMap[jvm[arg]]
  }
  for (const arg in game) {
    if (Object.keys(gameArgMap).includes(game[arg])) game[arg] = gameArgMap[game[arg]]
  }
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
