export type TemurinMeta = {
  binary: {
    architecture: 'x64' | 'x86' | 'x32' | 'ppc64' | 'ppc64le' | 's390x' | 'aarch64' | 'arm' | 'sparcv9' | 'riscv64'
    download_count: number
    heap_size: 'normal' | 'large'
    image_type: 'jre' | 'jdk'
    installer: TemurinMetaDownload
    jvm_impl: 'hotspot'
    os: 'linux' | 'windows' | 'mac' | 'solaris' | 'aix' | 'alpine-linux'
    package: TemurinMetaDownload
    project: 'jdk' | 'valhalla' | 'metropolis' | 'jfr' | 'shenandoah'
    scm_ref: string
    updated_at: string
  }
  release_link: string
  release_name: string
  vendor: 'eclipse'
  version: {
    build: number
    major: number
    minor: number
    openjdk_version: string
    optional: string
    security: number
    semver: string
  }
}

export type TemurinMetaDownload = {
  checksum: string
  checksum_link: string
  download_count: number
  link: string
  metadata_link: string
  name: string
  signature_link: string
  size: number
}
