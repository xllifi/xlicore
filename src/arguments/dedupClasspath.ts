import { Launch } from "../launch.js";

export function makeClasspath(launch: Launch, ...classpaths: string[][]): string[] {
  const classpath: string[] = classpaths.flat()

  const filterentries = classpath.map((x): CPFilterEntry => ({
    full_path: x,
    name: x.replace(/^.*[\\/](.*)(?:.*[\\/]){2}.*$/gm, "$1"),
    isNative: x.match(/^.*[\\/].*natives.*$/) != undefined
  }))

  const filtered = filterentries.reduce((acc: Array<CPFilterEntry>, cv) => {
    if (cv.isNative || !acc.some(x => x.name == cv.name)) acc.push(cv)
    return acc
  }, new Array<CPFilterEntry>)

  return filtered.map(x => x.full_path)
}

type CPFilterEntry = {
  full_path: string
  name: string
  isNative: boolean
}
