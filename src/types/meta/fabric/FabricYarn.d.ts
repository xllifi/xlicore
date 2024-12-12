// Types for https://meta.fabricmc.net/v2/versions/yarn links

export type FabricVersionsYarn = [
  {
    /** Minecraft version */
    gameVersion: string
    /** Minecraft version and Yarn build number separator */
    separator: string
    /** Yarn build number */
    build: number
    /** Package's maven name */
    maven: string
    /** Package's version */
    version: string
    /** Is latest release */
    stable: boolean
  }
]
