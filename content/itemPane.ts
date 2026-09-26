import type { IZotero, ZoteroItem } from '../typings/zotero'
declare const Zotero: IZotero

class ItemPane {
  public async updateSelectedEntity(): Promise<void> {
    const zoteroPane = Zotero.getActiveZoteroPane()
    if (!zoteroPane) return
    Zotero.debug('scihub: updating items in selected collections')
    if (!zoteroPane.canEdit()) {
      zoteroPane.displayCannotEditLibraryMessage()
      return
    }

    // Zotero 10 allows selecting several collections at once
    const collections = zoteroPane.getSelectedCollections
      ? zoteroPane.getSelectedCollections(false)
      : [zoteroPane.getSelectedCollection(false)]
    const items: ZoteroItem[] = []
    for (const collection of collections) {
      if (collection) items.push(...collection.getChildItems(false, false))
    }
    await Zotero.Scihub.updateItems(items)
  }

  public async updateSelectedItems(): Promise<void> {
    const zoteroPane = Zotero.getActiveZoteroPane()
    if (!zoteroPane) return
    Zotero.debug('scihub: updating selected items')
    const items = zoteroPane.getSelectedItems()
    await Zotero.Scihub.updateItems(items)
  }
}

export { ItemPane }
