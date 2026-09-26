import { IZotero, ZoteroItem, ZoteroObserver, ProgressWindow } from '../typings/zotero'
import { regularItem1, regularItem2, attachmentsById } from './zoteroItem.mock'
import { spy } from 'sinon'

const progressWindowSpy = spy()

const Zotero: IZotero = new class {
  public Scihub

  public initializationPromise = Promise.resolve()
  public debug(_msg: string) { return }
  public alert(_window: Window | null, _title: string, msg: string) { throw new Error(msg) }
  public getMainWindow() { return null }
  public getMainWindows() { return [] }
  public getActiveZoteroPane() { return null }
  public logError(_err: Error | string) { return }
  public launchURL(_url: string) { return }
  public openInViewer(_uri: string, _options?: Record<string, any>) { return null }

  public Notifier: IZotero['Notifier'] = new class {
    public registerObserver(_observer: ZoteroObserver, _types: string[], _id: string, _priority?: number) {
      return 'observer-id'
    }
    public unregisterObserver(_id: string) { return }
  }

  public Prefs = new class {
    private prefs: Record<string, string | number | boolean> = {}

    public get(pref: string): string | number | boolean {
      return this.prefs[pref]
    }

    public set(pref: string, value: string | number | boolean) {
      this.prefs[pref] = value
    }
  }

  Items = new class {
    public get(ids: number[]): ZoteroItem[] {
      return ids.map(id => attachmentsById[id]).filter(Boolean)
    }

    public async getAsync(ids: number | number[]): Promise<any | any[]> {
      if (Array.isArray(ids)) {
        return Promise.resolve([regularItem1, regularItem2])
      } else {
        return Promise.resolve(regularItem1)
      }
    }

    public async getAll(_libraryID: number, _onlyTopLevel?: boolean, _includeDeleted?: boolean): Promise<ZoteroItem[]> {
      return Promise.resolve([regularItem1, regularItem2])
    }
  }

  public HTTP = new class {
    public async request(method: string, url: string, options?: {
      body?: string
      responseType?: XMLHttpRequestResponseType
      noCache?: boolean
      successCodes?: number[] | false
      headers?: Record<string, string>
    }): Promise<XMLHttpRequest> {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, false)
      if (options?.responseType) {
        xhr.responseType = options.responseType
      }
      xhr.send()
      return Promise.resolve(xhr)
    }
  }

  public Attachments = new class {
    public async importFromURL(_options: Record<string, any>): Promise<ZoteroItem> {
      return Promise.resolve(regularItem1)
    }
    public async addAvailableFile(_item: ZoteroItem, _options?: { methods?: string[] }): Promise<ZoteroItem | false> {
      return Promise.resolve(false)
    }
  }

  public Libraries = new class {
    public getAll() { return [{ libraryID: 1, editable: true }] }
  }

  public PreferencePanes = new class {
    public async register(_options: Record<string, any>): Promise<string> { return Promise.resolve('pane-id') }
    public unregister(_id: string) { return }
  }

  public ProgressWindow = class implements ProgressWindow {
    public changeHeadline(headline: string, _icon?: string, _postText?: string) {
      progressWindowSpy(headline)
    }
    public addDescription(_body: string) { return }
    public startCloseTimer(_millis: number) { return }
    public show() { return }
  }
}

export { Zotero, progressWindowSpy }
