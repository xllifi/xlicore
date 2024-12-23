import { Launch } from './launch.js'
import type { LaunchOpts, GameLaunchArguments } from './types/Launch.ts'
import type { DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderFile, DownloaderLastProgress } from './types/utils/Downloader.js'

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
  DownloaderCallbackOnFinish, DownloaderCallbackOnProgress, DownloaderFile, DownloaderLastProgress
}
