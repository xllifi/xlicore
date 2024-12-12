// Types for version links found on https://piston-meta.mojang.com/mc/game/version_manifest_v2.json

type VersionManifest = {
  /** Must-have arguments. */
  arguments: VersionManifestArguments,
  /** Assets list. */
  assetIndex: VersionManifestAssetIndex,
  /** Seems to be same as `assetIndex.id`:
   * Used for `--assetIndex` game argument.
   */
  assets: string,
  /** No idea what that is. All current versions (up to `1.21.4-pre1`) seem to have it at `1`. */
  complianceLevel: number,
  /** JAR files. Use in `-jar` argument. */
  downloads: {
    /** Client JAR file data */
    client: VersionManifestDownloadsEntry
    /** Client mappings */
    client_mappings: VersionManifestDownloadsEntry
    /** Server JAR file */
    server: VersionManifestDownloadsEntry
    /** Server mappings */
    server_mappings: VersionManifestDownloadsEntry
  },
  /** Version ID */
  id: string
  /** Java version data */
  javaVersion: {
    /** Java version codename. This is used to download Java from Mojang's servers: https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json */
    component: string,
    /** Java version. */
    majorVersion: number
  },
  /** Libraries. Mandatory to launch the game. */
  libraries: Array<VersionManifestLibrariesEntry>,
  /** Logging rules. Honestly, doesn't seem to do much. */
  logging: { [key: string]: VersionManifestLoggingEntry },
  /** Main class. */
  mainClass: string,
  /** Seems to only be used by official launcher. */
  minimumLauncherVersion: number,
  /** Release time formatted in ISO 8601 date and time with offset */
  releaseTime: string,
  /** Seems to be same as `releaseTime`:
   * *Release time formatted in ISO 8601 date and time with offset* */
  time: string,
  /** Release type. E.g. `snapshot`, `release` */
  type: string
}

type VersionManifestArguments = {
  /** Minecraft arguments. Put **after** `-jar` argument. */
  game: Array<string | VersionManifestArgumentsRule>,
  /** JVM arguments. Put **before** `-jar` argument. */
  jvm: Array<string | VersionManifestArgumentsRule>,
}

type VersionManifestArgumentsRule = {
  /** Some conditions according to which this should apply. */
  rules: Array<{
      /** Action. Should launcher add it (`allow`) or not (`disallow`). */
      action: string,
      /** Is launcher feature enabled. Probably only used for official launcher. */
      features: { [key: string]: boolean },
    }>
  /** Argument to add / not add. */
  value: string | Array<string>,
}

type VersionManifestAssetIndex = {
  /** Used for `--assetIndex` game argument. */
  id: string,
  /** SHA1 checksum. */
  sha1: string,
  /** File size in bytes. */
  size: number,
  /** Total assets size in bytes. Used to calculate download percentage. */
  totalSize: number,
  /** File download URL. */
  url: string,
}

type VersionManifestDownloadsEntry = {
  /** SHA1 checksum. */
  sha1: string,
  /** File size in bytes. */
  size: number,
  /** File download URL. */
  url: string,
}

type VersionManifestLibrariesEntry = {
  /** */
  downloads: {
    artifact: VersionManifestLibrariesEntryArtifact
  },
  /** Library package and version. */
  name: string,
  /** Some conditions according to which you should download this. */
  rules?: Array<VersionManifestLibrariesEntryRule>
}
type VersionManifestLibrariesEntryArtifact = {
  /** Where should you save the library. Used for `-cp` argument. */
  path: string,
  /** SHA1 checksum. */
  sha1: string,
  /** File size in bytes. */
  size: number,
  /** File download URL. */
  url: string
}

type VersionManifestLibrariesEntryRule = {
  /** Action. Should launcher download it (`allow`) or not (`disallow`). */
  action: string,
  /** Some OS data. */
  os: {
    /** OS name. E.g. `windows`, `linux`, `osx` */
    name?: string
    /** OS architecture. E.g. `x386`, `amd64` */
    arch?: string
  },
}

type VersionManifestLoggingEntry = {
  argument: string,
  file: {
    id: string
    /** SHA1 checksum. */
    sha1: string,
    /** File size in bytes. */
    size: number,
    /** File download URL. */
    url: string
  },
  type: string
}
