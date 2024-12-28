export type launchCredentials = {
  /** Access token */
  accessToken?: string
  /** Client ID */
  clientId?: string
  /** Profile UUID */
  uuid?: string
  /** Profile name */
  name: string
  /**
   * `msa` for [Microsoft Authentication Scheme](https://minecraft.wiki/w/Minecraft_Wiki:Projects/wiki.vg_merge/Microsoft_Authentication_Scheme),
   * `legacy` for [Legacy Minecraft Authentication](https://minecraft.wiki/w/Minecraft_Wiki:Projects/wiki.vg_merge/Legacy_Minecraft_Authentication) and
   * `mojang` for [Legacy Mojang Authentication](https://minecraft.wiki/w/Minecraft_Wiki:Projects/wiki.vg_merge/Legacy_Mojang_Authentication).
   */
  userType: 'msa' | 'legacy' | 'mojang'
  /** drasl parameters */
  drasl?: {
    server: string
  }
}
