export = new class {
  public async updateSelectedEntity(libraryId: string) {
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

  public async updateSelectedItems() {
    Zotero.debug('scihub: updating selected items')
    const items = ZoteroPane.getSelectedItems()
    await Zotero.Scihub.updateItems(items)
  }
}
