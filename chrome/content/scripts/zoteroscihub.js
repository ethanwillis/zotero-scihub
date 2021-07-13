Zotero.Scihub = {
    DEFAULT_SCIHUB_URL: "https://sci-hub.do/",
    DEFAULT_AUTOMATIC_PDF_DOWNLOAD: true,
    itemsQueue: [],

    init_scihub_url: function() {
        // Set default if not set.
        if (Zotero.Prefs.get('zoteroscihub.scihub_url') === undefined) {
            Zotero.Prefs.set('zoteroscihub.scihub_url', Zotero.Scihub.DEFAULT_SCIHUB_URL);
        }
    },

    init_automatic_pdf_download: function() {
        // Set default if not set.
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
        // Adds pdfs when new item is added to zotero.
        notify: function(event, type, ids, extraData) {
            automatic_pdf_download_bool = Zotero.Prefs.get('zoteroscihub.automatic_pdf_download');
            if (event == "add" && !(automatic_pdf_download_bool === undefined) && automatic_pdf_download_bool == true) {
                suppressWarnings = true;
                Zotero.Scihub.updateItems(Zotero.Items.get(ids), suppressWarnings);
            }
        }
    },

    updateSelectedEntity: async function(libraryId) {
        Zotero.debug('Updating items in entity')
        if (!ZoteroPane.canEdit()) {
            ZoteroPane.displayCannotEditLibraryMessage();
            return;
        }

        var collection = ZoteroPane.getSelectedCollection(false);

        if (collection) {
            Zotero.debug("Updating items in entity: Is a collection == true")
            var items = [];
            collection.getChildItems(false, false).forEach(function(item) {
                items.push(item);
            });
            suppressWarnings = true;
            await Zotero.Scihub.updateItems(items, suppressWarnings);
        }
    },

    updateSelectedItems: async function() {
        Zotero.debug('Updating Selected items');
        suppressWarnings = false;
        await Zotero.Scihub.updateItems(ZoteroPane.getSelectedItems(), suppressWarnings);
    },

    updateAll: async function() {
        Zotero.debug('Updating all items in Zotero')

        const allItems = await Zotero.Items.getAll();
        const items = allItems.filter((item) => {
            const libraryId = item.getField('libraryID');
            return item.isRegularItem() && !item.isCollection() &&
                (libraryId == null || libraryId == '' || Zotero.Libraries.isEditable(libraryId));
        });

        suppressWarnings = true;
        await Zotero.Scihub.updateItems(items, suppressWarnings);
    },

    updateItems: async function(items, suppressWarnings) {
        for (let item of items) {
            if (!item.isRegularItem() || item.isCollection()) { continue; }

            if (Zotero.Scihub.getDoi(item)) {
                await Zotero.Scihub.updateItem(item);
            } else if (!suppressWarnings) {
                alert(`DOI not found: ${item.getField('title')}`);
            }
        }
    },

    getDoi: function(item) {
        const doi = item.getField('DOI');
        if (doi && (typeof doi == 'string') && doi.length > 0) {
            return doi;
        }
    },

    generateItemUrl: function(item) {
        const doi = Zotero.Scihub.getDoi(item);
        if (doi) {
            const baseURL = Zotero.Prefs.get('zoteroscihub.scihub_url');
            return new URL(doi, baseURL);
        }
    },

    urlToHttps: function(url) {
        // Default to the secure connection for fetching PDFs
        // Handles special case if URL starts with "//"
        safe_url = new URL(url.replace(/^\/\//, "https://"));
        safe_url.protocol = "https";
        return safe_url;
    },

    updateItem: async function(item) {
        const url = Zotero.Scihub.generateItemUrl(item);
        Zotero.debug(`scihub: querying ${url}`);

        try {
            const pdfUrl = Zotero.Scihub.urlToHttps(await Zotero.Scihub.querySciHub(url));
            await Zotero.Scihub.attachRemotePDFToItem(pdfUrl, item);
        } catch (error) {
            alert(`Failed to fetch PDF: ${error}. Try again later or solve CAPTCHA if required`);
            Zotero.Scihub.openUrlToUser(url);        
        }
    },

    querySciHub: function(url) {
        return new Promise((resolve, reject) => {
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

    openUrlToUser: function(url) {
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
    }
};

window.addEventListener('load', function(e) {
    Zotero.Scihub.init();
}, false);