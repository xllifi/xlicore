import * as path from 'node:path'
import type { LaunchOpts } from './types/Launch.ts'
import { Launch } from './launch.js'
import 'dotenv/config'
import { DraslAuth } from './auth/drasl.js'

const drasl = new DraslAuth({
  username: process.env.AUTHUSRNM!,
  password: process.env.AUTHPW!,
  server: process.env.AUTHSRV!,
  saveDir: path.resolve(process.cwd(), 'store/instance')
})

const launchOpts: LaunchOpts = {
  auth: await drasl.init(),
  useAuthlib: true,
  rootDir: path.resolve(process.cwd(), 'store'),
  version: '1.21.1',
  mrpack: {
    url: 'https://cdn.modrinth.com/data/1KVo5zza/versions/NyiXTqoa/Fabulously.Optimized-v6.2.3-mr.1.mrpack',
    verify: {
      hash: '6bcdaedaed389e4c37bd22c10276126a47806aba',
      algorithm: 'sha1'
    }
  }
}
export const launch = new Launch(launchOpts)
launch.start()
