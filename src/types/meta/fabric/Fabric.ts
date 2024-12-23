import { FabricVersionsGame } from './FabricGame.js'
import { FabricVersionsInstaller } from './FabricInstaller.js'
import { FabricVersionsIntermediary } from './FabricIntermediary.js'
import { FabricVersionsLoader } from './FabricLoader.js'
import { FabricVersionsYarn } from './FabricYarn.js'

// Types for https://meta.fabricmc.net/v2/versions/

export type FabricVersions = {
  game: FabricVersionsGame[]
  mappings: FabricVersionsYarn[]
  intermediary: FabricVersionsIntermediary[]
  loader: FabricVersionsLoader[]
  installer: FabricVersionsInstaller[]
}
