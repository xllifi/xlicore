// Types for https://launchermeta.mojang.com/mc/game/version_manifest_v2.json

export type GlobalManifest = {
  latest: {
    release: string
    snapshot: string
  }
  versions: Array<GlobalManifestVersion>
}
export type GlobalManifestVersion = {
  /** Minecraft version */
  id: string
  /** Release type */
  type: 'release' | 'snapshot'
  /** Version manifest URL */
  url: string
  /** Unknown purpose */
  time: string
  /** Version release time */
  releaseTime: string
  /** Version manifest SHA1 */
  sha1: string
  /** Unknown purpose */
  complianceLevel: number
}
