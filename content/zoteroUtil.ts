import { UrlUtil } from './urlUtil'

declare const Zotero: IZotero

export abstract class ZoteroUtil {
  public static async attachRemotePDFToItem(pdfUrl: URL, item: IZotero['Item']) {
    const filename = UrlUtil.extractFileNameFromUrl(pdfUrl)

    // Download PDF and add as attachment
    const importOptions = {
      libraryID: item.libraryID,
      url: pdfUrl.href,
      parentItemID: item.id,
      title: item.getField('title'),
      fileBaseName: filename,
      contentType: 'application/pdf',
      referrer: '',
      cookieSandbox: null,
    }
    Zotero.debug(`Import Options: ${JSON.stringify(importOptions, null, '\t')}`)

    const result = await Zotero.Attachments.importFromURL(importOptions)
    Zotero.debug(`Import result: ${JSON.stringify(result)}`)
  }

  public static showPopup(title: string, body: string, isError = false, timeout = 5) {
    // Shows user-friendly Zotero popup
    const seconds = 1000
    const pw = new Zotero.ProgressWindow()
    if (isError) {
      pw.changeHeadline('Error', 'chrome://zotero/skin/cross.png', `Sci-Hub: ${title}`)
    } else {
      pw.changeHeadline(`Sci-Hub: ${title}`)
    }
    pw.addDescription(body)
    pw.show()
    pw.startCloseTimer(timeout * seconds)
  }
}
