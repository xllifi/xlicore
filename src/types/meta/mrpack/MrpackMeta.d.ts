export type MrpackMeta = {
  formatVersion: number
  game: string
  versionId: string
  name: string
  summary?: string
  files: MrpackFile[]
  dependencies: {
    minecraft?: string
    forge?: string
    neoforge?: string
    'fabric-loader'?: string
    'quilt-loader'?: string
  }
}

export type MrpackFile = {
  path: string
  hashes: {
    sha1: string
    sha512: string
  }
  env?: {
    client: 'required' | 'optional' | 'unsupported'
    server: 'required' | 'optional' | 'unsupported'
  }
  downloads: string[]
  fileSize: number
}
