import type { ZoteroItem, IZotero } from '../typings/zotero'

declare const Zotero: IZotero

class ToolsPane {
  public async updateAll(): Promise<void> {
    Zotero.debug('scihub: updating all items')

    const items: ZoteroItem[] = []
    for (const library of Zotero.Libraries.getAll()) {
      if (!library.editable) continue
      const libraryItems = await Zotero.Items.getAll(library.libraryID, false, false)
      items.push(...libraryItems.filter(item => item.isRegularItem()))
    }

    await Zotero.Scihub.updateItems(items)
  }
}

export { ToolsPane }
