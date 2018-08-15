if(typeof Zotero === 'undefined') {
  Zotero = {};
}
Zotero.Scihub = {};

Zotero.Scihub.init = function() {
  Zotero.Scihub.resetState();

  // Register the callback in Zotero as an item observer
  var notifierID = Zotero.Notifier.registerObserver(
          Zotero.Scihub.notifierCallback, ['item']);

  // Unregister callback when the window closes (important to avoid a memory leak)
  window.addEventListener('unload', function(e) {
      Zotero.Notifier.unregisterObserver(notifierID);
  }, false);
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
  Zotero.Scihub.numberOfUpdatedItems = 0;
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
    Zotero.debug('Updating Selected items');
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
    var baseURL = "http://sci-hub.tw/"
    var DOI = item.getField('DOI');
    var url = "";
    if(DOI && (typeof DOI == 'string') && DOI.length > 0) {
      url = baseURL+DOI;
    }
    return url;
};

Zotero.Scihub.updateItem = function(item) {
  var url = Zotero.Scihub.generateItemUrl(item);
  var pdf_url = "";
  var parser = new DOMParser();
  var req = new XMLHttpRequest();


  Zotero.debug('Opening ' + url);
  req.open('GET', url, true);
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      if (req.status == 200 && req.responseText.search("captcha") == -1) {
        if (item.isRegularItem() && !item.isCollection()) {
          try {
            Zotero.debug('Parsing webpage ' + url);
            // Extract direct pdf url from scihub webpage.
            var split_html = req.responseText.split('<iframe src = "')
            pdf_url = split_html[1].split('"')[0]

            // Handle error on Scihub where https is not prepended to url
            if(pdf_url.slice(0, 2) == "//") {
              pdf_url = "https:" + pdf_url
            }

            // Make sure all scihub urls use https and not http.
            if(pdf_url.slice(0, 5) != "https") {
              pdf_url = "https" + pdf_url.slice(4)
            }

            // Extract PDF name.
            var split_url = pdf_url.split('/');
            var fileBaseName = split_url[split_url.length-1].split('.pdf')[0]
          } catch(e) {
            Zotero.debug("Error parsing webpage 1: " + e)
            Zotero.debug("Error parsing webpage 2: " + req.responseText)
          }

          try {
            // Download PDF and add as attachment.
            var import_options = {
              libraryID: item.libraryID,
              url: pdf_url,
              parentItemID: item.id,
              title: item.getField('title'),
              fileBaseName: fileBaseName,
              referrer: '',
              cookieSandbox: null
            };
            Zotero.debug("Import Options: " + JSON.stringify(import_options, null, "\t"));
            Zotero.Attachments.importFromURL(import_options)
              .then(function(result) {
                Zotero.debug("Import result: " + JSON.stringify(result))
              })
              .catch(function(error) {
                Zotero.debug("Import error: " + error)
                // See the following code, if Scihub throws a captcha then our import will throw this error.
                // https://github.com/zotero/zotero/blob/26056c87f1d0b31dc56981adaabcab8fc2f85294/chrome/content/zotero/xpcom/attachments.js#L863
                // If a PDF link shows a captcha, pop up a new browser window to enter the captcha.
                Zotero.debug("Scihub is asking for captcha for: " + pdf_url);
                alert('Please enter the Captcha on the page that will now open and then re-try updating the PDFs, or wait a while to get unblocked by Scihub if the Captcha is not present.');
                req2 = new XMLHttpRequest();
                req2.open('GET', pdf_url, true);
                req2.onreadystatechange = function() {
                 if (req2.readyState == 4) {
                   if (typeof Zotero.launchURL !== 'undefined') {
                     Zotero.launchURL(pdf_url);
                   } else if (typeof Zotero.openInViewer !== 'undefined') {
                     Zotero.openInViewer(pdf_url);
                   } else if (typeof ZoteroStandalone !== 'undefined') {
                     ZoteroStandalone.openInViewer(pdf_url);
                   } else {
                     window.gBrowser.loadOneTab(pdf_url, {inBackground: false});
                   }
                   Zotero.Scihub.resetState();
                 }
                }
                req2.send(null);
              });
          } catch(e) {
            Zotero.debug("Error creating attachment: " + e)
          }
        }
        Zotero.Scihub.updateNextItem();
      } else if (req.status == 200 || req.status == 403 || req.status == 503) {
        // If too many requests were made.. pop up a new browser window to
        // allow user to enter in captcha for scihub.
        Zotero.debug('Scihub is asking for captcha for: ' + url);
        alert(Zotero.Scihub.captchaString);
        req2 = new XMLHttpRequest();
        req2.open('GET', url, true);
        req2.onreadystatechange = function() {
          if (req2.readyState == 4) {
            if (typeof Zotero.launchURL !== 'undefined') {
              Zotero.launchURL(url);
            } else if (typeof Zotero.openInViewer !== 'undefined') {
              Zotero.openInViewer(url);
            } else if (typeof ZoteroStandalone !== 'undefined') {
              ZoteroStandalone.openInViewer(url);
            } else {
              window.gBrowser.loadOneTab(url, {inBackground: false});
            }
            Zotero.Scihub.resetState();
          }
        }
        req2.send(null);
      }
    }
  };
  req.send(null);
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        Zotero.Scihub.init();
    }, false);
}
