import { DraslAuth } from './auth/drasl.js'
import { Launch } from './launch.js'
import type { LaunchOpts, GameLaunchArguments } from './types/Launch.ts'
import { launchCredentials } from './types/meta/auth/launchCredentials.js'
import type { DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderFile, DownloaderLastProgress } from './types/utils/Downloader.js'
import { genDirs } from './utils/general.js'

// const launchOpts: LaunchOpts = {
//   auth: 'xllifi',
//   authserver: '',
//   rootDir: path.resolve(process.cwd(), 'store'),
//   version: '1.21.1',
//   verify: true,
//   fabric: {
//     version: null
//   }
// }
// export const launch = new Launch(launchOpts)
// launch.start()

// process.on('unhandledRejection', (err) => {
//   console.error(`Unexpected error: "${JSON.stringify(err)}" ${err}`)
// })

// process.on('beforeExit', () => {
//   console.log(`\n\n\n\nCLASSPATH: "${[...minecraftCP, ...fabricCP].join(`;`)}"`)
// })

export {
  Launch,
  LaunchOpts, GameLaunchArguments,
  DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderFile, DownloaderLastProgress,
  DraslAuth, launchCredentials,
  genDirs,
}
