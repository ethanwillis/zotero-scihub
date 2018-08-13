if(typeof Zotero === 'undefined') {
  Zotero = {};
}
Zotero.Scihub = {};

Zotero.Scihub.init = function() {

}

Zotero.Scihub.notifierCallback = {
  notify: function(event, type, ids, extraData) {
    if(event == "add") {
      Zotero.Scihub.updateItems(Zotero.Items.get(ids));
    }
  }
}

Zotero.Scihub.resetState = function() {
  Zotero.Scihub.current = -1;
  Zotero.Scihub.toUpdate = 0;
  Zotero.Scihub.itemsToUpdate = null;
  Zotero.Scihub.numberOfUpdatesItems = 0;
}

Zotero.Scihub.updateSelectedEntity = function(libraryId) {
  if (!ZoteroPane.canEdit()) {
    ZoteroPane.displayCannotEditLibraryMessage();
    return;
  }

  var collection = ZoteroPane.getSelectedCollection();
  var group = ZoteroPane.getSelectedGroup();

  if (collection) {
      var items = [];
      collection.getChildItems(false).forEach(function (item) {
          items.push(Zotero.Items.get(item.id));
      });
      Zotero.Scihub.updateItems(items);
  } else if (group) {
      if (!group.editable) {
          alert("This group is not editable!");
          return;
      }
      var items = [];
      group.getCollections().forEach(function(collection) {
          collection.getChildItems(false).forEach(function(item) {
              items.push(Zotero.Items.get(item.id));
          })
      });
      Zotero.Scihub.updateItems(items);
  } else {
      Zotero.Scihub.updateAll();

  }
};

Zotero.Scihub.updateSelectedItems = function() {
    Zotero.Scihub.updateItems(ZoteroPane.getSelectedItems());
};

Zotero.Scihub.updateAll = function() {
    var items = [];
    Zotero.Items.getAll().forEach(function (item) {
        if (item.isRegularItem() && !item.isCollection()) {
            var libraryId = item.getField('libraryID');
            if (libraryId == null ||
                    libraryId == '' ||
                    Zotero.Libraries.isEditable(libraryId)) {
                items.push(item);
            }
        }
    });
    Zotero.Scihub.updateItems(items);
};

Zotero.Scihub.updateItems = function(items) {
    if (items.length == 0 ||
            Zotero.Scihub.numberOfUpdatedItems < Zotero.Scihub.toUpdate) {
        return;
    }

    Zotero.Scihub.resetState();
    Zotero.Scihub.toUpdate = items.length;
    Zotero.Scihub.itemsToUpdate = items;
    Zotero.Scihub.updateNextItem();
};

Zotero.Scihub.updateNextItem = function() {
    Zotero.Scihub.numberOfUpdatedItems++;

    if (Zotero.Scihub.current == Zotero.Scihub.toUpdate - 1) {
        Zotero.Scihub.resetState();
        return;
    }

    Zotero.Scihub.current++;
    Zotero.Scihub.updateItem(
            Zotero.Scihub.itemsToUpdate[Zotero.Scihub.current]);
};

Zotero.Scihub.generateItemUrl = function(item) {
    var baseUrl = "http://sci-hub.tw/"
    var DOI = item.getField('DOI');
    var url = "";
    if(DOI && (typeof DOI == 'string') && DOI.length > 0) {
      url = baseURL+DOI;
    } 
    return url;
};

Zotero.Scihub.updateItem = function(item) {
    //var req = new XMLHttpRequest();
    var url = Zotero.Scihub.generateItemUrl(item);
    //req.open('GET', url, true);

    // Add SCIHUB link to item
    item.setField('DOI', url)

    //req.onreadystatechange = function() {
      // Get Scihub pdf and add to item.
    //};

    //req.send(null);
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        Zotero.Scihub.init();
    }, false);
}

module.exports = Zotero.Scihub;
