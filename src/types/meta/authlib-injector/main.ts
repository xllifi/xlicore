export type Artifact = {
  build_number: number
  version: string
  release_time: string
  download_url: string
  checksums: {
    sha256: string
  }
}
