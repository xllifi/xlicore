// Types for assetIndex links found in version manifests

export type AssetIndex = {
  objects: {
    [key: string]: AssetIndexObject
  }
}

export type AssetIndexObject = {
  /** SHA1 hash of the asset.
   * Also used to get asset's link:
   * https://resources.download.minecraft.net/<first 2 symbols of the hash>/<full hash>
   */
  hash: string
  size: number
}
