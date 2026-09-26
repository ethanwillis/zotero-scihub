/* global Zotero, Services */

function install() {}

async function startup({ id, version, rootURI }) {
  await Zotero.initializationPromise

  // No chrome registration: every resource (icon, preference pane, localization)
  // is addressed through rootURI. Note that registerChrome() in current Firefox
  // only accepts "content", "locale" and "override" entries; a "skin" entry
  // throws NS_ERROR_ILLEGAL_VALUE and aborts the whole startup.
  Services.scriptloader.loadSubScript(`${rootURI}content/scihub.js`)
  Zotero.Scihub.init({ id, version, rootURI })
  await Zotero.Scihub.startup()
}

function onMainWindowLoad({ window }) {
  Zotero.Scihub?.addToWindow(window)
}

function onMainWindowUnload({ window }) {
  Zotero.Scihub?.removeFromWindow(window)
}

function shutdown() {
  if (Zotero.Scihub) {
    Zotero.Scihub.shutdown()
    delete Zotero.Scihub
  }
}

function uninstall() {}
