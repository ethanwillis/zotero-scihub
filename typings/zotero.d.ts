interface IZoteroPane {
  canEdit: () => boolean
  displayCannotEditLibraryMessage: () => void
  getSelectedCollection: (asID: boolean) => ZoteroCollection | null
  // Zotero 10+: several collections can be selected at once
  getSelectedCollections?: (asID: boolean) => ZoteroCollection[]
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
  // ids of the child attachments (regular items only)
  getAttachments: (includeTrashed?: boolean) => number[]
  isPDFAttachment: () => boolean
}

interface ZoteroLibrary {
  libraryID: number
  editable: boolean
}

interface ProgressWindow {
  changeHeadline: (headline: string, icon?: string, postText?: string) => void
  addDescription: (body: string) => void
  startCloseTimer: (millis: number) => void
  show: () => void
}

interface IZotero {
  Scihub: import('../content/scihub').Scihub

  initializationPromise: Promise<void>
  debug: (msg: string) => void
  alert: (window: Window | null, title: string, msg: string) => void
  getMainWindow: () => Window | null
  getMainWindows: () => (Window & Record<string, any>)[]
  getActiveZoteroPane: () => IZoteroPane | null
  logError: (err: Error | string) => void
  launchURL: (url: string) => void
  openInViewer: (uri: string, options?: Record<string, any>) => Window | null

  Notifier: {
    registerObserver: (observer: ZoteroObserver, types: string[], id: string, priority?: number) => string
    unregisterObserver: (id: string) => void
  }

  Prefs: {
    get: (pref: string) => string | number | boolean
    set: (pref: string, value: string | number | boolean) => any
  }

  Items: {
    get: (ids: number[]) => ZoteroItem[]
    getAsync: (ids: number | number[]) => Promise<any | any[]>
    getAll: (libraryID: number, onlyTopLevel?: boolean, includeDeleted?: boolean) => Promise<ZoteroItem[]>
  }

  HTTP: {
    request: (method: string, url: string, options?: {
      body?: string,
      responseType?: XMLHttpRequestResponseType,
      noCache?: boolean,
      successCodes?: number[] | false,
      headers?: Record<string, string>,
    }) => Promise<XMLHttpRequest>
  }

  Attachments: {
    importFromURL: (options: Record<string, any>) => Promise<ZoteroItem>
    // Zotero's "Find Full Text": resolves an open-access PDF and attaches it, false if none
    addAvailableFile: (item: ZoteroItem, options?: { methods?: string[] }) => Promise<ZoteroItem | false>
  }

  Libraries: {
    getAll: () => ZoteroLibrary[]
  }

  PreferencePanes: {
    register: (options: { pluginID: string, src: string, label?: string, image?: string, scripts?: string[] }) => Promise<string>
    unregister: (id: string) => void
  }

  ProgressWindow: {
    new(): ProgressWindow
  }
}

export { ZoteroItem, ZoteroObserver, IZotero, IZoteroPane, ProgressWindow }