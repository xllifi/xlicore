// Types for https://meta.fabricmc.net/v2/versions/intermediary links

export type FabricVersionsIntermediary = {
  /** Package's maven name */
  maven: string
  /** Package's version */
  version: string
  /** https://github.com/FabricMC/fabric-meta/issues/5 */
  stable: boolean
}
