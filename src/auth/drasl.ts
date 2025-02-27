import ky from 'ky'
import * as DraslAuthenticate from '../types/meta/auth/drasl/authenticate.js'
import * as DraslValidate from '../types/meta/auth/drasl/validate.js'
import * as DraslInvalidate from '../types/meta/auth/drasl/invalidate.js'
import * as DraslSignout from '../types/meta/auth/drasl/signout.js'
import * as DraslRefresh from '../types/meta/auth/drasl/refresh.js'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import fswin from 'fswin'
import { launchCredentials } from '../types/meta/auth/launchCredentials.js'

export type DraslOpts = {
  /** Drasl server root. Example: `https://drasl.unmojang.org` */
  server: string
  /** `.super_secret.json` file's directory */
  saveDir?: string
}

type LoginCredentials = {
  username: string
  password: string
}

export class DraslAuth {
  opts: DraslOpts
  authserver: string
  authFilepath: string | undefined

  constructor(opts: DraslOpts) {
    this.opts = opts
    this.authserver = opts.server
    if (opts.saveDir) this.authFilepath = path.resolve(opts.saveDir, '.super_secret.json')
  }

  async init(creds: LoginCredentials): Promise<launchCredentials> {
    let json: DraslAuthenticate.Response

    if (this.authFilepath && fs.existsSync(this.authFilepath)) {
      json = await fsp.readFile(this.authFilepath, { encoding: 'utf8' }).then(async (val) => {
        const json = JSON.parse(val)
        if (!DraslAuthenticate.isValidResponse(json) || !(await this.validate(json))) {
          return await this.refresh(json)
        }
        return json
      })
    } else {
      json = await this.first(creds)
    }

    return {
      accessToken: json.accessToken,
      clientId: json.clientToken,
      userType: 'mojang',
      uuid: json.selectedProfile.id,
      name: json.selectedProfile.name,
      drasl: {
        server: this.opts.server
      }
    }
  }

  async first(creds: LoginCredentials): Promise<DraslAuthenticate.Response> {
    if (!creds.password) throw new Error('[Drasl Auth] Password not specified!')

    const body: DraslAuthenticate.Request = {
      agent: {
        name: 'Minecraft',
        version: 1
      },
      username: creds.username,
      password: creds.password,
      requestUser: true
    }

    const resp: DraslAuthenticate.Response = await ky
      .post<DraslAuthenticate.Response>(this.authserver + '/authenticate', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .json()

    await this.writeJson(resp)
    return resp
  }

  async refresh(body: DraslRefresh.Request): Promise<DraslRefresh.Response> {
    const resp: DraslRefresh.Response = await ky
      .post<DraslRefresh.Response>(this.authserver + '/refresh', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .json()

    await this.writeJson(resp)
    return resp
  }

  async invalidate(body: DraslInvalidate.Request): Promise<void> {
    await ky.post<DraslRefresh.Response>(this.authserver + '/refresh', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  async writeJson(json: DraslAuthenticate.Response): Promise<void> {
    if (!this.authFilepath) return

    fswin.setAttributesSync(this.authFilepath, { IS_HIDDEN: false })
    return await fsp.writeFile(this.authFilepath, JSON.stringify(json), { encoding: 'utf8' }).then(() => {
      fswin.setAttributesSync(this.authFilepath!, { IS_HIDDEN: true }) // FIXME: if porting to other OSes
    })
  }

  async validate(json: DraslAuthenticate.Response): Promise<boolean> {
    const body: DraslValidate.Request = {
      accessToken: json.accessToken,
      clientToken: json.clientToken
    }

    const resp = await ky.post(this.authserver + '/validate', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (resp.status == 204) return true
    if (resp.status == 403) return false
    throw new Error(`Unhandled status ${resp.status}: ${resp.statusText}!`)
  }

  async signout(creds: LoginCredentials): Promise<void> {
    if (!creds.password) throw new Error(`No password! Can't sign out.`)
    const body: DraslSignout.Request = {
      username: creds.username,
      password: creds.password
    }

    const resp = await ky.post(this.authserver + 'signout', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (resp.status == 401) throw new Error(`Invalid credentials! Can't sign out.`)
    if (resp.status != 204) throw new Error(`Unhandled status ${resp.status}: ${resp.statusText}!`)
  }
}
