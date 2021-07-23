import { CScihub } from '../content/scihub'

declare global {
  interface IZoteroPane {
    canEdit(): boolean
    displayCannotEditLibraryMessage(): void
    getSelectedCollection(asID: boolean): IZotero['Collection'] | null
    getSelectedItems(): [IZotero['Item']]
  }

  interface IZotero {
    Scihub: CScihub

    debug(msg: string): void
    logError(err: Error | string): void
    launchURL(url: string): void

    Notifier: {
      registerObserver(onserver: any, types: string[], id: string, priority?: number): number // any => ZoteroObserver
      unregisterObserver(id: number): void
    }

    Prefs: {
      get(pref: string): any
      set(pref: string, value: string | number | boolean): any
    }

    Items: {
      getAsync(ids: number | number[]): Promise<any | any[]>
      getAll(): Promise<[IZotero['Item']]>
    }

    HTTP: {
      request(method: string, url: string, options?: {
        body?: string,
        responseType?: string,
        headers?: Record<string, string>,
      }): Promise<XMLHttpRequest>
    }

    Attachments: {
      importFromURL(options: object): Promise<IZotero['Item']>
    }

    Libraries: {
      isEditable(libraryId: string): boolean
    }

    Item: {
      new(): {}
      id: string
      libraryID: string
      getField(field: string, unformatted?: boolean, includeBaseMapped?: boolean): string
      isRegularItem(): boolean
      isCollection(): boolean
    }

    ProgressWindow: {
      new(): {
        changeHeadline(headline: string, icon?: string, postText?: string): void
        addDescription(body: string): void
        startCloseTimer(milis: number): void
        show(): void
      }
    }

    Collection: {
      getChildItems(asIDs: boolean, includeDeleted: boolean): [IZotero['Item']]
    }
  }
}

