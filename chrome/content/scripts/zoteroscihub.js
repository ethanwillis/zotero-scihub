Zotero.Scihub = {
    // TODO: better error reporting
    // TOOD: only bulk-update items which are missing paper attachement
    DEFAULT_SCIHUB_URL: "https://sci-hub.do/",
    DEFAULT_AUTOMATIC_PDF_DOWNLOAD: true,

    init_scihub_url: function() {
        if (Zotero.Prefs.get('zoteroscihub.scihub_url') === undefined) {
            Zotero.Prefs.set('zoteroscihub.scihub_url', Zotero.Scihub.DEFAULT_SCIHUB_URL);
        }
    },

    init_automatic_pdf_download: function() {
        if (Zotero.Prefs.get('zoteroscihub.automatic_pdf_download') === undefined) {
            Zotero.Prefs.set('zoteroscihub.automatic_pdf_download', Zotero.Scihub.DEFAULT_AUTOMATIC_PDF_DOWNLOAD);
        }
    },

    init: function() {
        Zotero.Scihub.init_scihub_url();
        Zotero.Scihub.init_automatic_pdf_download();

        // Register the callback in Zotero as an item observer
        var notifierID = Zotero.Notifier.registerObserver(
            Zotero.Scihub.notifierCallback, ['item']);

        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener('unload', function(e) {
            Zotero.Notifier.unregisterObserver(notifierID);
        }, false);
    },

    notifierCallback: {
        // Adds pdfs when new item is added to Zotero
        notify: function(event, type, ids, extraData) {
            automatic_pdf_download_bool = Zotero.Prefs.get('zoteroscihub.automatic_pdf_download');
            if (event == "add" && !(automatic_pdf_download_bool === undefined) && automatic_pdf_download_bool == true) {
                Zotero.Scihub.updateItems(Zotero.Items.get(ids));
            }
        }
    },

    updateSelectedEntity: async function(libraryId) {
        Zotero.debug(`scihub: updating items in entity ${libraryId}`)
        if (!ZoteroPane.canEdit()) {
            ZoteroPane.displayCannotEditLibraryMessage();
            return;
        }

        const collection = ZoteroPane.getSelectedCollection(false);
        if (collection) {
            const items = collection.getChildItems(false, false);
            await Zotero.Scihub.updateItems(items);
        }
    },

    updateSelectedItems: async function() {
        Zotero.debug('scihub: updating selected items');
        const items = ZoteroPane.getSelectedItems();
        await Zotero.Scihub.updateItems(items);
    },

    updateAll: async function() {
        Zotero.debug('scihub: updating all items')

        const allItems = await Zotero.Items.getAll();
        const items = allItems.filter((item) => {
            // TODO: why library id must be empty?
            const libraryId = item.getField('libraryID');
            return item.isRegularItem() && !item.isCollection() &&
                (libraryId == null || libraryId == '' || Zotero.Libraries.isEditable(libraryId));
        });

        await Zotero.Scihub.updateItems(items);
    },

    updateItems: async function(items) {
        // WARN: Sequentially go through items, parallel will fail due to rate-limiting
        // Cycle needs to be broken if scihub asks for Captcha,
        // then user have to be redirected to the page to fill it in
        for (let item of items) {
            // Skip items which are not processable
            if (!item.isRegularItem() || item.isCollection()) { continue; }

            // Skip items without DOI or if URL generation had failed
            const url = Zotero.Scihub.generateItemUrl(item);
            if (!url) {
                Zotero.Scihub.showPopup(`Missing DOI for "${item.getField('title')}"`)
                Zotero.debug(`scihub: failed to generate URL for "${item.getField('title')}"`)
                continue;
            }

            try {
                await Zotero.Scihub.updateItem(url, item);
            } catch (error) {
                // FIXME: no need to break the process if it's just missing paper
                // TODO: detect when PDF is not available
                Zotero.debug(`scihub: failed to fetch PDF from "${url}"`)
                alert(
                    `Captcha is required or PDF is not ready yet for "${item.getField('title')}".\n` +
                    `You will be redirected to the scihub page.\nRestart fetching process manually.\n` +
                    `Error message: ${error}`);
                Zotero.Scihub.redirectUserToUrl(url);
                break;
            }
        }
    },

    getDoi: function(item) {
        const doiField = item.getField('DOI');
        const doiFromExtra = Zotero.Scihub.getDoiFromExtra(item);
        const doiFromUrl = Zotero.Scihub.getDoiFromUrl(item);
        const doi = doiField || doiFromExtra || doiFromUrl;

        if (doi && (typeof doi == 'string') && doi.length > 0) {
            return doi;
        }
    },

    getDoiFromExtra: function(item) {
        // For books "extra" field might contain DOI instead
        // values in extra are <key>: <value> separated by newline
        const extra = item.getField('extra');
        const match = extra.match(/^DOI: (.+)$/m);
        if (match) {
            return match[1];
        }
    },

    getDoiFromUrl: function(item) {
        // If item was added by the doi.org url it can be extracted from its pathname
        const url = item.getField('url');
        const isDoiOrg = url.match(/\bdoi\.org\b/i);
        if (isDoiOrg) {
            const doiPath = new URL(url).pathname;
            return decodeURIComponent(doiPath).replace(/^\//, '');
        }
    },

    generateItemUrl: function(item) {
        const doi = Zotero.Scihub.getDoi(item);
        if (doi) {
            const baseUrl = Zotero.Prefs.get('zoteroscihub.scihub_url');
            return new URL(doi, baseUrl);
        }
    },

    urlToHttps: function(url) {
        // Default to the secure connection for fetching PDFs
        // Handles special case if URL starts with "//"
        let safe_url = new URL(url.replace(/^\/\//, "https://"));
        safe_url.protocol = "https";
        return safe_url;
    },

    updateItem: async function(url, item) {
        Zotero.Scihub.showPopup(`Fetching PDF for "${item.getField('title')}"`)
        const pdfUrl = Zotero.Scihub.urlToHttps(await Zotero.Scihub.querySciHub(url));
        await Zotero.Scihub.attachRemotePDFToItem(pdfUrl, item);
    },

    querySciHub: function(url) {
        return new Promise((resolve, reject) => {
            Zotero.debug(`scihub: querying ${url}`);

            const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = "document";
            xhr.onload = () => {
                // TODO: detect captcha by response content
                const pdfIframe = xhr.responseXML.querySelector("iframe#pdf");
                if (xhr.status == 200 && pdfIframe !== null) {
                    resolve(pdfIframe.src);
                } else {
                    reject(xhr.statusText);
                }
            };
            xhr.onerror = () => { reject(xhr.statusText) };
            xhr.send();
        });
    },

    extractFileName: function(url) {
        // Keeps the last token of the pathname supposing it is filename, eg
        // https://example.com/path/<filename.pdf>?params
        return new URL(url).pathname.split('/').pop();
    },

    attachRemotePDFToItem: async function(pdf_url, item) {
        const fileBaseName = Zotero.Scihub.extractFileName(pdf_url);

        // Download PDF and add as attachment
        const importOptions = {
            libraryID: item.libraryID,
            url: pdf_url.href,
            parentItemID: item.id,
            title: item.getField('title'),
            fileBaseName: fileBaseName,
            contentType: 'application/pdf',
            referrer: '',
            cookieSandbox: null
        };
        Zotero.debug("Import Options: " + JSON.stringify(importOptions, null, "\t"));

        const result = await Zotero.Attachments.importFromURL(importOptions)
        Zotero.debug("Import result: " + JSON.stringify(result))
    },

    redirectUserToUrl: function(url) {
        // Redirects user to the given URL, eg to enter captcha or visually debug what is broken

        if (typeof Zotero.launchURL !== 'undefined') {
            Zotero.launchURL(url);
        } else if (typeof Zotero.openInViewer !== 'undefined') {
            Zotero.openInViewer(url);
        } else if (typeof ZoteroStandalone !== 'undefined') {
            ZoteroStandalone.openInViewer(url);
        } else {
            window.gBrowser.loadOneTab(url, {
                inBackground: false
            });
        }
    },

    showPopup: function(body, timeout = 5) {
        // Shows user-friendly Zotero popup
        const seconds = 1000;
        const pw = new Zotero.ProgressWindow();
        pw.changeHeadline(`Sci-Hub`)
        if (Array.isArray(body)) body = body.join('\n');
        pw.addDescription(body);
        pw.show();
        pw.startCloseTimer(timeout * seconds);
    }
};

window.addEventListener('load', function(e) {
    Zotero.Scihub.init();
}, false);