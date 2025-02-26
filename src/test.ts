import * as path from 'node:path'
import type { LaunchOpts } from './types/Launch.ts'
import { Launch } from './launch.js'
import 'dotenv/config'
import { DraslAuth } from './auth/drasl.js'
import fs from 'fs'

if (!fs.existsSync(path.resolve(process.cwd(), 'store/instance'))) {
  fs.mkdirSync(path.resolve(process.cwd(), 'store/instance'), { recursive: true })
}

const creds = {
  username: process.env.AUTHUSRNM!,
  password: process.env.AUTHPW!
}

const drasl = new DraslAuth({
  server: process.env.AUTHSRV!,
  saveDir: path.resolve(process.cwd(), 'store/instance')
})

const launchOpts: LaunchOpts = {
  auth: await drasl.init(creds),
  useAuthlib: true,
  rootDir: path.resolve(process.cwd(), 'store'),
  version: '1.21.1',
  mrpack: {
    url: 'https://cdn.modrinth.com/data/BYfVnHa7/versions/wODzvDvO/Simply%20Optimized-1.21.1-4.3.mrpack',
    // url: 'https://cdn.modrinth.com/data/5FFgwNNP/versions/Jln0oj6n/Cobblemon%20Modpack%20%5BFabric%5D%201.6.mrpack',
  }
}
export const launch = new Launch(launchOpts)
launch.start()
