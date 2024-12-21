import * as path from 'node:path'
import { LaunchOpts } from './types/Launch.js'
import { Launch } from './index.js'

const launchOpts: LaunchOpts = {
  auth: 'xllifi',
  authserver: '',
  rootDir: path.resolve(process.cwd(), 'store'),
  version: '1.21.1',
  verify: true,
  fabric: {
    version: null
  }
}
export const launch = new Launch(launchOpts)
launch.start()
