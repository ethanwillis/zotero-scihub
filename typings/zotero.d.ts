interface IZoteroPane {
  canEdit: () => boolean
  displayCannotEditLibraryMessage: () => void
  getSelectedCollection: (asID: boolean) => ZoteroCollection | null
  getSelectedItems: () => [ZoteroItem]
}

interface ZoteroCollection {
  getChildItems: (asIDs: boolean, includeDeleted: boolean) => [ZoteroItem]
}

interface ZoteroObserver {
  notify: (event: string, type: string, ids: [number], extraData: Record<string, any>) => Promise<void>
}

interface ZoteroItem {
  id: string
  libraryID: string
  getField: (field: string, unformatted?: boolean, includeBaseMapped?: boolean) => string
  isRegularItem: () => boolean
  isCollection: () => boolean
}

interface ProgressWindow {
  changeHeadline: (headline: string, icon?: string, postText?: string) => void
  addDescription: (body: string) => void
  startCloseTimer: (millis: number) => void
  show: () => void
}

interface IZotero {
  Scihub: import('../content/scihub').Scihub

  debug: (msg: string) => void
  logError: (err: Error | string) => void
  launchURL: (url: string) => void

  Notifier: {
    registerObserver: (observer: ZoteroObserver, types: string[], id: string, priority?: number) => number // any => ZoteroObserver
    unregisterObserver: (id: number) => void
  }

  Prefs: {
    get: (pref: string) => string | number | boolean
    set: (pref: string, value: string | number | boolean) => any
  }

  Items: {
    getAsync: (ids: number | number[]) => Promise<any | any[]>
    getAll: () => Promise<ZoteroItem[]>
  }

  HTTP: {
    request: (method: string, url: string, options?: {
      body?: string,
      responseType?: XMLHttpRequestResponseType,
      headers?: Record<string, string>,
    }) => Promise<XMLHttpRequest>
  }

  Attachments: {
    importFromURL: (options: Record<string, any>) => Promise<ZoteroItem>
  }

  Libraries: {
    isEditable: (libraryId: string) => boolean
  }

  ProgressWindow: {
    new(): ProgressWindow
  }
}

export { ZoteroItem, ZoteroObserver, IZotero, IZoteroPane, ProgressWindow }