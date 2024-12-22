import * as path from 'node:path'
import { LaunchOpts } from './types/Launch.js'
import { Launch } from './launch.js'

const launchOpts: LaunchOpts = {
  auth: 'xllifi',
  authserver: '',
  rootDir: path.resolve(process.cwd(), 'store'),
  version: '1.21.1',
  mrpack: {
    link: 'https://cdn.modrinth.com/data/1KVo5zza/versions/NyiXTqoa/Fabulously.Optimized-v6.2.3-mr.1.mrpack',
    verify: {
      hash: '6bcdaedaed389e4c37bd22c10276126a47806aba',
      algorithm: 'sha1'
    }
  }
}
export const launch = new Launch(launchOpts)
launch.start()
