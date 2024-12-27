import ky from 'ky'
import type { LaunchOpts } from '../types/Launch.js'
import type { Launch } from '../launch.js'
import * as DraslAuthenticate from '../types/meta/drasl/api/auth/authenticate.js'
import * as DraslValidate from '../types/meta/drasl/api/auth/validate.js'
import * as DraslSignout from '../types/meta/drasl/api/auth/signout.js'
import * as DraslRefresh from '../types/meta/drasl/api/auth/refresh.js'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import fswin from 'fswin'
import { launchCredentials } from '../types/meta/drasl/launchCredentials.js'

export class DraslAuth {
  launch: Launch
  opts: LaunchOpts
  authserver: string
  authFilepath: string

  constructor(launch: Launch, opts: LaunchOpts) {
    this.launch = launch
    this.opts = opts
    this.authserver = this.opts.auth.server || 'https://drasl.unmojang.org'
    this.authFilepath = path.resolve(this.launch.instancePath, '.super_secret.json')
  }

  async init(): Promise<launchCredentials> {
    let json: DraslAuthenticate.Response

    if (!fs.existsSync(this.authFilepath)) {
      json = await this.first()
    }

    json = await fsp.readFile(this.authFilepath, { encoding: 'utf8' }).then(async (val) => {
      const json = JSON.parse(val)
      if (!DraslAuthenticate.isValidResponse(json) || !(await this.validate(json))) {
        return await this.refresh(json)
      }
      return json
    })

    return {
      accessToken: json.accessToken,
      clientId: json.clientToken,
      userType: 'mojang',
      uuid: json.selectedProfile.id,
      name: json.selectedProfile.name
    }
  }

  async first(): Promise<DraslAuthenticate.Response> {
    if (!this.opts.auth.password) throw '[Drasl Auth] Password not specified!'

    const body: DraslAuthenticate.Request = {
      agent: {
        name: 'Minecraft',
        version: 1
      },
      username: this.opts.auth.username,
      password: this.opts.auth.password,
      requestUser: true
    }

    const resp: DraslAuthenticate.Response = await ky
      .post<DraslAuthenticate.Response>(this.authserver + '/authenticate', {
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      })
      .json()

    await this.writeJson(resp)
    return resp
  }

  async refresh(json: DraslAuthenticate.Response): Promise<DraslRefresh.Response> {
    const body: DraslRefresh.Request = {
      accessToken: json.accessToken,
      clientToken: json.clientToken,
      requestUser: true,
      selectedProfile: json.selectedProfile
    }

    const resp: DraslRefresh.Response = await ky
      .post<DraslRefresh.Response>(this.authserver + '/refresh', {
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      })
      .json()

    await this.writeJson(resp)
    return resp
  }

  async writeJson(json: DraslAuthenticate.Response): Promise<void> {
    fswin.setAttributesSync(this.authFilepath, { IS_HIDDEN: false })
    return await fsp.writeFile(this.authFilepath, JSON.stringify(json), { encoding: 'utf8' }).then(() => {
      fswin.setAttributesSync(this.authFilepath, { IS_HIDDEN: true }) // FIXME: if porting to other OSes
    })
  }

  async validate(json: DraslAuthenticate.Response): Promise<boolean> {
    const body: DraslValidate.Request = {
      accessToken: json.accessToken,
      clientToken: json.clientToken
    }

    const resp = await ky.post(this.authserver + '/validate', {
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    })

    if (resp.status == 204) return true
    if (resp.status == 403) return false
    throw `Unhandled status ${resp.status}: ${resp.statusText}!`
  }

  async signout(): Promise<void> {
    if (!this.opts.auth.password) throw `No password! Can't sign out.`
    const body: DraslSignout.Request = {
      username: this.opts.auth.username,
      password: this.opts.auth.password
    }

    const resp = await ky.post(this.authserver + 'signout', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (resp.status == 401) throw `Invalid credentials! Can't sign out.`
    if (resp.status != 204) throw `Unhandled status ${resp.status}: ${resp.statusText}!`
  }
}
