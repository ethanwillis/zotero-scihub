import type { IZotero, IZoteroPane } from '../typings/zotero'
declare const ZoteroPane: IZoteroPane
declare const Zotero: IZotero

class ItemPane {
  public async updateSelectedEntity(libraryId: string): Promise<void> {
    Zotero.debug(`scihub: updating items in entity ${libraryId}`)
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage()
      return
    }

    const collection = ZoteroPane.getSelectedCollection(false)
    if (collection) {
      const items = collection.getChildItems(false, false)
      await Zotero.Scihub.updateItems(items)
    }
  }

  public async updateSelectedItems(): Promise<void> {
    Zotero.debug('scihub: updating selected items')
    const items = ZoteroPane.getSelectedItems()
    await Zotero.Scihub.updateItems(items)
  }
}

export { ItemPane }
