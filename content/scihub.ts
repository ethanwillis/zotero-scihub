import type { ZoteroItem, IZotero, ZoteroObserver } from '../typings/zotero'
import { ItemPane } from './itemPane'
import { ToolsPane } from './toolsPane'
import { PrefPane } from './prefPane'
import { UrlUtil } from './urlUtil'
import { ZoteroUtil } from './zoteroUtil'

declare const Zotero: IZotero

enum HttpCodes {
  DONE = 200,
}

class PdfNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfNotFoundError'
    Object.setPrototypeOf(this, PdfNotFoundError.prototype)
  }
}

class ItemObserver implements ZoteroObserver {
  // Called when a new item is added to the library
  public async notify(event: string, _type: string, ids: [number], _extraData: Record<string, any>) {
    const automaticPdfDownload = Zotero.Scihub.isAutomaticPdfDownload()

    if (event === 'add' && automaticPdfDownload) {
      const items = await Zotero.Items.getAsync(ids)
      await Zotero.Scihub.updateItems(items)
    }
  }
}

class Scihub {
  // TOOD: only bulk-update items which are missing paper attachement
  private static readonly DEFAULT_SCIHUB_URL = 'https://sci-hub.tf/'
  private static readonly DEFAULT_AUTOMATIC_PDF_DOWNLOAD = true
  private observerId: number | null = null
  private initialized = false
  public ItemPane: ItemPane
  public PrefPane: PrefPane
  public ToolsPane: ToolsPane

  constructor() {
    this.ItemPane = new ItemPane()
    this.PrefPane = new PrefPane()
    this.ToolsPane = new ToolsPane()
  }

  public getBaseScihubUrl(): string {
    if (Zotero.Prefs.get('zoteroscihub.scihub_url') === undefined) {
      Zotero.Prefs.set('zoteroscihub.scihub_url', Scihub.DEFAULT_SCIHUB_URL)
    }

    return Zotero.Prefs.get('zoteroscihub.scihub_url') as string
  }

  public isAutomaticPdfDownload(): boolean {
    if (Zotero.Prefs.get('zoteroscihub.automatic_pdf_download') === undefined) {
      Zotero.Prefs.set('zoteroscihub.automatic_pdf_download', Scihub.DEFAULT_AUTOMATIC_PDF_DOWNLOAD)
    }

    return Zotero.Prefs.get('zoteroscihub.automatic_pdf_download') as boolean
  }

  public load(): void {
    // Register the callback in Zotero as an item observer
    if (this.initialized) return
    this.observerId = Zotero.Notifier.registerObserver(new ItemObserver(), ['item'], 'Scihub')
    this.initialized = true
  }

  public unload(): void {
    if (this.observerId) {
      Zotero.Notifier.unregisterObserver(this.observerId)
    }
  }

  public async updateItems(items: [ZoteroItem]): Promise<void> {
    // WARN: Sequentially go through items, parallel will fail due to rate-limiting
    // Cycle needs to be broken if scihub asks for Captcha,
    // then user have to be redirected to the page to fill it in
    for (const item of items) {
      // Skip items which are not processable
      if (!item.isRegularItem() || item.isCollection()) { continue }

      // Skip items without DOI or if URL generation had failed
      const scihubUrl = this.generateScihubItemUrl(item)
      if (!scihubUrl) {
        ZoteroUtil.showPopup('DOI is missing', item.getField('title'), true)
        Zotero.debug(`scihub: failed to generate URL for "${item.getField('title')}"`)
        continue
      }

      try {
        await this.updateItem(scihubUrl, item)
      } catch (error) {
        if (error instanceof PdfNotFoundError) {
          // Do not stop traversing items if PDF is missing for one of them
          ZoteroUtil.showPopup('PDF not available', `Try again later.\n"${item.getField('title')}"`, true)
          continue
        } else {
          // Break if Captcha is reached, alert user and redirect
          alert(
            `Captcha is required or PDF is not ready yet for "${item.getField('title')}".\n\
            You will be redirected to the scihub page.\n\
            Restart fetching process manually.\n\
            Error message: ${error}`)
          Zotero.launchURL(scihubUrl.href)
          break
        }
      }
    }
  }

  private async updateItem(scihubUrl: URL, item: ZoteroItem) {
    ZoteroUtil.showPopup('Fetching PDF', item.getField('title'))

    const xhr = await Zotero.HTTP.request('GET', scihubUrl.href, { responseType: 'document' })
    const pdfIframe = xhr.responseXML?.querySelector('iframe#pdf') as HTMLIFrameElement
    const body = xhr.responseXML?.querySelector('body')

    if (xhr.status === HttpCodes.DONE && pdfIframe) {
      const pdfUrl = UrlUtil.urlToHttps(pdfIframe.src)
      await ZoteroUtil.attachRemotePDFToItem(pdfUrl, item)
    } else if (xhr.status === HttpCodes.DONE && body?.innerText?.match(/Please try to search again using DOI/im)) {
      Zotero.debug(`scihub: PDF is not available at the moment "${scihubUrl}"`)
      throw new PdfNotFoundError(`Pdf is not available: ${scihubUrl}`)
    } else {
      Zotero.debug(`scihub: failed to fetch PDF from "${scihubUrl}"`)
      throw new Error(xhr.statusText)
    }
  }

  private getDoi(item: ZoteroItem): string | null {
    const doiField = item.getField('DOI')
    const doiFromExtra = this.getDoiFromExtra(item)
    const doiFromUrl = this.getDoiFromUrl(item)
    const doi = doiField ?? doiFromExtra ?? doiFromUrl

    if (doi && (typeof doi === 'string') && doi.length > 0) {
      return doi
    }
    return null
  }

  private getDoiFromExtra(item: ZoteroItem): string | null {
    // For books "extra" field might contain DOI instead
    // values in extra are <key>: <value> separated by newline
    const extra = item.getField('extra')
    const match = extra.match(/^DOI: (.+)$/m)
    if (match) {
      return match[1] as string
    }
    return null
  }

  private getDoiFromUrl(item: ZoteroItem): string | null {
    // If item was added by the doi.org url it can be extracted from its pathname
    const url = item.getField('url')
    const isDoiOrg = url.match(/\bdoi\.org\b/i)
    if (isDoiOrg) {
      const doiPath = new URL(url).pathname
      return decodeURIComponent(doiPath).replace(/^\//, '')
    }
    return null
  }

  private generateScihubItemUrl(item: ZoteroItem): URL | null {
    const doi = this.getDoi(item)
    if (doi) {
      const baseUrl = this.getBaseScihubUrl()
      return new URL(doi, baseUrl)
    }
    return null
  }
}

Zotero.Scihub = new Scihub()

window.addEventListener('load', _ => {
  Zotero.Scihub.load()
}, false)
window.addEventListener('unload', _ => {
  Zotero.Scihub.unload()
}, false)


export { Scihub }
