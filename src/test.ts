import * as path from 'node:path'
import type { LaunchOpts } from './types/Launch.ts'
import { Launch } from './launch.js'
import 'dotenv/config'
import { DraslAuth } from './auth/drasl.js'
import fs from 'fs'

if (!fs.existsSync(path.resolve(process.cwd(), 'store/instance'))) {
  fs.mkdirSync(path.resolve(process.cwd(), 'store/instance'), { recursive: true })
}

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
    url: 'https://cdn.modrinth.com/data/BYfVnHa7/versions/wODzvDvO/Simply%20Optimized-1.21.1-4.3.mrpack',
    verify: {
      hash: 'c39a70c80ae697de8d95e8c5d20dcd591250f98c',
      algorithm: 'sha1'
    }
  }
}
export const launch = new Launch(launchOpts)
launch.start()
