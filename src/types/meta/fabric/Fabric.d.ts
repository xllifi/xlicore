import { FabricVersionsGame } from './FabricGame'
import { FabricVersionsInstaller } from './FabricInstaller'
import { FabricVersionsIntermediary } from './FabricIntermediary'
import { FabricVersionsLoader } from './FabricLoader'
import { FabricVersionsYarn } from './FabricYarn'

// Types for https://meta.fabricmc.net/v2/versions/

export type FabricVersions = {
  game: FabricVersionsGame[]
  mappings: FabricVersionsYarn[]
  intermediary: FabricVersionsIntermediary[]
  loader: FabricVersionsLoader[]
  installer: FabricVersionsInstaller[]
}
