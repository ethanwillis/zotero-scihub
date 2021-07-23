declare const Zotero: IZotero

export = new class {
  public async updateAll() {
    Zotero.debug('scihub: updating all items')

    const allItems = await Zotero.Items.getAll()
    const items = allItems.filter(item => {
      // TODO: why library id must be empty?
      const libraryId = item.getField('libraryID')
      return item.isRegularItem() && !item.isCollection() &&
        (libraryId == null || libraryId === '' || Zotero.Libraries.isEditable(libraryId))
    }) as [IZotero['Item']]

    await Zotero.Scihub.updateItems(items)
  }
}
