import { MavenParserReturn } from '../types/utils/MavenParser.js'

/**
 * Util for parsing maven downloads from Fabric's LauncherMeta
 * @param args Maven host, Package path, Package url and Package version
 * @returns Package download URL
 */
export function mavenParse(mavenUrl: string, packageName: string): MavenParserReturn {
  const split: string[] = packageName.split(':')
  if (split.length > 3) throw `Unparseable maven package name ${packageName} (more than 2 :'s)`
  const filename = `${split[1]}-${split[2]}.jar`

  if (!mavenUrl.match(/^.+:\/{2}/g)) {
    mavenUrl = mavenUrl.replace(/^[:/]+/gm, '')
    mavenUrl = `https://${mavenUrl}/`
  }
  mavenUrl = mavenUrl.replace(/\/+$/gm, '') + '/'

  for (let arg of split) {
    const index = split.indexOf(arg)
    if (index === 0) {
      arg = arg.replaceAll('.', '/')
    }
    arg = arg.replace(/^\/+|\/+$/gm, '')
    arg += '/'
    split[index] = arg
  }
  return { url: mavenUrl + split.join('') + filename, filedir: split.join(''), filename }
}
