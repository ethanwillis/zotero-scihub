import type { ZoteroItem, IZotero, ZoteroObserver } from '../typings/zotero'
import { ItemPane } from './itemPane'
import { ToolsPane } from './toolsPane'
import { UrlUtil } from './urlUtil'
import { ZoteroUtil } from './zoteroUtil'

declare const Zotero: IZotero

enum HttpCodes {
  // Zotero.HTTP.request reports 0 when no response came back (DNS failure, connection refused...)
  NO_RESPONSE = 0,
  DONE = 200,
  NOT_FOUND = 404,
}

class PdfNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfNotFoundError'
    Object.setPrototypeOf(this, PdfNotFoundError.prototype)
  }
}

class NetworkError extends Error {
  constructor(public readonly host: string) {
    super(`Cannot reach ${host}`)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
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
  private static readonly DEFAULT_SCIHUB_URL = 'https://sci-hub.ru/'
  // Sci-Hub stopped adding papers in 2022; newer ones are often uploaded to Sci-Net
  private static readonly DEFAULT_SCINET_URL = 'https://sci-net.xyz/'
  private static readonly DEFAULT_AUTOMATIC_PDF_DOWNLOAD = true
  private static readonly MENU_ELEMENT_CLASS = 'zotero-scihub-menu'
  private static readonly USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
  private observerId: string | null = null
  private prefPaneId: string | null = null
  private initialized = false
  private pluginId = ''
  private rootURI = ''
  public ItemPane: ItemPane
  public ToolsPane: ToolsPane

  constructor() {
    this.ItemPane = new ItemPane()
    this.ToolsPane = new ToolsPane()
  }

  public init({ id, rootURI }: { id: string, version: string, rootURI: string }): void {
    this.pluginId = id
    this.rootURI = rootURI
  }

  public getBaseScihubUrl(): string {
    if (Zotero.Prefs.get('zoteroscihub.scihub_url') === undefined) {
      Zotero.Prefs.set('zoteroscihub.scihub_url', Scihub.DEFAULT_SCIHUB_URL)
    }

    return (Zotero.Prefs.get('zoteroscihub.scihub_url') as string).trim()
  }

  public getBaseScinetUrl(): string {
    if (Zotero.Prefs.get('zoteroscihub.scinet_url') === undefined) {
      Zotero.Prefs.set('zoteroscihub.scinet_url', Scihub.DEFAULT_SCINET_URL)
    }

    return (Zotero.Prefs.get('zoteroscihub.scinet_url') as string).trim()
  }

  public isAutomaticPdfDownload(): boolean {
    if (Zotero.Prefs.get('zoteroscihub.automatic_pdf_download') === undefined) {
      Zotero.Prefs.set('zoteroscihub.automatic_pdf_download', Scihub.DEFAULT_AUTOMATIC_PDF_DOWNLOAD)
    }

    return Zotero.Prefs.get('zoteroscihub.automatic_pdf_download') as boolean
  }

  public async startup(): Promise<void> {
    if (this.initialized) return
    // Register the callback in Zotero as an item observer
    this.observerId = Zotero.Notifier.registerObserver(new ItemObserver(), ['item'], 'Scihub')
    this.prefPaneId = await Zotero.PreferencePanes.register({
      pluginID: this.pluginId,
      src: `${this.rootURI}content/preferences.xhtml`,
      label: 'Zotero Scihub',
      image: `${this.rootURI}skin/default/sci-hub-logo.svg`,
    })
    for (const win of Zotero.getMainWindows()) {
      if (win.ZoteroPane) this.addToWindow(win)
    }
    this.initialized = true
  }

  public shutdown(): void {
    if (this.observerId) {
      Zotero.Notifier.unregisterObserver(this.observerId)
      this.observerId = null
    }
    if (this.prefPaneId) {
      Zotero.PreferencePanes.unregister(this.prefPaneId)
      this.prefPaneId = null
    }
    for (const win of Zotero.getMainWindows()) {
      this.removeFromWindow(win)
    }
    this.initialized = false
  }

  public addToWindow(win: Window & Record<string, any>): void {
    const doc = win.document as Document & { createXULElement: (tagName: string) => HTMLElement }
    if (doc.querySelector(`.${Scihub.MENU_ELEMENT_CLASS}`)) return
    win.MozXULElement.insertFTLIfNeeded('zotero-scihub.ftl')

    const icon = `${this.rootURI}skin/default/sci-hub-logo.svg`
    const addMenu = (popupId: string, menuId: string, l10nId: string, command: () => Promise<void>) => {
      const popup = doc.getElementById(popupId)
      if (!popup) return
      const separator = doc.createXULElement('menuseparator')
      separator.classList.add(Scihub.MENU_ELEMENT_CLASS)
      const menuitem = doc.createXULElement('menuitem')
      menuitem.id = menuId
      menuitem.classList.add('menuitem-iconic', Scihub.MENU_ELEMENT_CLASS)
      menuitem.setAttribute('data-l10n-id', l10nId)
      menuitem.setAttribute('image', icon)
      menuitem.addEventListener('command', () => { command().catch(err => Zotero.logError(err)) })
      popup.append(separator, menuitem)
    }

    addMenu('zotero-itemmenu', 'zotero-itemmenu-scihub', 'zotero-scihub-update-item', () => this.ItemPane.updateSelectedItems())
    addMenu('zotero-collectionmenu', 'zotero-collectionmenu-scihub', 'zotero-scihub-update-collection', () => this.ItemPane.updateSelectedEntity())
    addMenu('menu_ToolsPopup', 'zotero-scihub-tools-updateall', 'zotero-scihub-update-all', () => this.ToolsPane.updateAll())
  }

  public removeFromWindow(win: Window): void {
    for (const elem of Array.from(win.document.querySelectorAll(`.${Scihub.MENU_ELEMENT_CLASS}`))) {
      elem.remove()
    }
    win.document.querySelector('[href="zotero-scihub.ftl"]')?.remove()
  }

  public async updateItems(items: ZoteroItem[]): Promise<void> {
    // WARN: Sequentially go through items, parallel will fail due to rate-limiting
    // Cycle needs to be broken if scihub asks for Captcha,
    // then user have to be redirected to the page to fill it in.
    // The page is opened in Zotero's own browser window because it shares
    // Zotero's cookie jar: once the captcha is solved there, the next
    // Zotero.HTTP.request goes through (an external browser keeps the cookie for itself)
    for (const item of items) {
      // Skip items which are not processable
      if (!item.isRegularItem()) { continue }

      // Skip items which already have a PDF attached
      if (this.hasPdfAttachment(item)) {
        Zotero.debug(`scihub: "${item.getField('title')}" already has a PDF attachment`)
        continue
      }

      // Skip items without DOI
      const doi = this.getDoi(item)
      if (!doi) {
        ZoteroUtil.showPopup('DOI is missing', item.getField('title'), true)
        Zotero.debug(`scihub: failed to generate URL for "${item.getField('title')}"`)
        continue
      }

      try {
        await this.updateItem(doi, item)
      } catch (error) {
        if (error instanceof PdfNotFoundError) {
          // Do not stop traversing items if PDF is missing for one of them
          ZoteroUtil.showPopup('PDF not available', `${error.message}.\n"${item.getField('title')}"`, true)
          continue
        } else if (error instanceof NetworkError) {
          // Nothing will work for the other items either: stop, without opening any page
          Zotero.alert(Zotero.getMainWindow(), 'Sci-Hub',
            `Cannot reach ${error.host}.\n\
            Your network may block it (DNS): try another Sci-Hub mirror in the plugin preferences\n\
            (e.g. https://sci-hub.box/) or another network.`)
          break
        } else {
          // Break if Captcha is reached, alert user and open the page in Zotero
          const scihubUrl = new URL(doi, this.getBaseScihubUrl())
          Zotero.alert(Zotero.getMainWindow(), 'Sci-Hub',
            `Captcha is required or PDF is not ready yet for "${item.getField('title')}".\n\
            The Sci-Hub page will open in Zotero: solve the captcha there,\n\
            then restart the fetching process manually.\n\
            Error message: ${error}`)
          Zotero.openInViewer(scihubUrl.href)
          break
        }
      }
    }
  }

  private async updateItem(doi: string, item: ZoteroItem) {
    ZoteroUtil.showPopup('Fetching PDF', item.getField('title'))

    let pdfUrl: string
    try {
      pdfUrl = await this.fetchScihubPdfUrl(new URL(doi, this.getBaseScihubUrl()))
    } catch (scihubError) {
      // Captcha and other unexpected errors are handled by the caller
      if (!(scihubError instanceof PdfNotFoundError) && !(scihubError instanceof NetworkError)) throw scihubError
      // Fall back to Sci-Net for papers Sci-Hub does not have (or cannot serve right now)
      const scinetUrl = new URL(doi, this.getBaseScinetUrl())
      Zotero.debug(`scihub: ${scihubError.message}, trying "${scinetUrl}"`)
      try {
        pdfUrl = await this.fetchScinetPdfUrl(scinetUrl)
      } catch (scinetError) {
        // Last resort: let Zotero look for an open-access copy (Unpaywall, OpenAlex, publisher page),
        // which is what Sci-Hub itself suggests for recent papers
        if (await this.attachOpenAccessPdf(item)) return
        // Report an unreachable Sci-Hub rather than a missing PDF it could not even look for
        if (scihubError instanceof NetworkError) throw scihubError
        // Sci-Hub did answer: a blocked Sci-Net only means this PDF is missing, do not stop the run
        if (scinetError instanceof NetworkError) {
          throw new PdfNotFoundError(`Not on Sci-Hub nor in open access, and ${scinetError.host} cannot be reached`)
        }
        throw new PdfNotFoundError('Not found on Sci-Hub, Sci-Net nor in open access')
      }
    }

    await ZoteroUtil.attachRemotePDFToItem(UrlUtil.urlToHttps(pdfUrl), item)
  }

  private async attachOpenAccessPdf(item: ZoteroItem): Promise<boolean> {
    Zotero.debug(`scihub: looking for an open-access copy of "${item.getField('title')}"`)
    try {
      return !!(await Zotero.Attachments.addAvailableFile(item))
    } catch (error) {
      Zotero.debug(`scihub: open-access lookup failed: ${error}`)
      return false
    }
  }

  private async fetchPage(url: URL): Promise<XMLHttpRequest> {
    const xhr = await Zotero.HTTP.request('GET', url.href, {
      responseType: 'document',
      // sci-hub.ru serves its pages with a 10-year max-age: without this a retry
      // after solving the captcha would get the cached captcha page again
      noCache: true,
      // a 404 is Sci-Hub's "no such paper" answer, not a transport error
      successCodes: false,
      headers: { 'User-Agent': Scihub.USER_AGENT },
    })
    if (xhr.status === HttpCodes.NO_RESPONSE) {
      // The Gecko error code (e.g. NS_ERROR_UNKNOWN_HOST) tells DNS, TLS and connection problems apart
      const channelStatus = (xhr as XMLHttpRequest & { channel?: { status: number } }).channel?.status
      const hex = 16
      Zotero.debug(`scihub: no response from "${url}" (DNS or network problem? channel status 0x${(channelStatus ?? 0).toString(hex)})`)
      throw new NetworkError(url.host)
    }
    return xhr
  }

  private async fetchScihubPdfUrl(scihubUrl: URL): Promise<string> {
    const xhr = await this.fetchPage(scihubUrl)
    // Mirrors such as sci-hub.box redirect to a regional domain: resolve links against the final URL
    const pdfUrl = this.extractScihubPdfUrl(xhr.responseXML, xhr.responseURL || scihubUrl.href)
    const body = xhr.responseXML?.querySelector('body')

    if (xhr.status === HttpCodes.DONE && pdfUrl) {
      return pdfUrl
    } else if (xhr.status === HttpCodes.DONE && this.isCaptchaPage(body)) {
      Zotero.debug(`scihub: captcha requested at "${scihubUrl}"`)
      throw new Error('Sci-Hub asks to verify that you are not a robot')
    } else if (xhr.status === HttpCodes.NOT_FOUND || xhr.status === HttpCodes.DONE) {
      // Any other 200 page (empty page, "not in the database", "try Sci-Net"...) means no PDF here
      if (!this.isPdfNotAvailable(body)) {
        const excerpt = 200
        Zotero.debug(`scihub: unrecognised page at "${scihubUrl}": ${body?.innerText?.trim().slice(0, excerpt)}`)
      }
      Zotero.debug(`scihub: PDF is not available at the moment "${scihubUrl}"`)
      throw new PdfNotFoundError(`Pdf is not available: ${scihubUrl}`)
    } else {
      Zotero.debug(`scihub: failed to fetch PDF from "${scihubUrl}"`)
      throw new Error(`${xhr.status} ${xhr.statusText}`)
    }
  }

  private async fetchScinetPdfUrl(scinetUrl: URL): Promise<string> {
    const xhr = await this.fetchPage(scinetUrl)
    // Sci-Net shows the paper in an iframe; unknown DOIs are redirected to the home page
    const rawUrl = xhr.responseXML?.querySelector('iframe[src*=".pdf"]')?.getAttribute('src')
    if (xhr.status === HttpCodes.DONE && rawUrl) {
      return new URL(rawUrl, xhr.responseURL || scinetUrl.href).href
    }
    Zotero.debug(`scihub: PDF is not available on Sci-Net "${scinetUrl}"`)
    throw new PdfNotFoundError(`Pdf is not available: ${scinetUrl}`)
  }

  private extractScihubPdfUrl(doc: Document | null | undefined, baseUrl: string): string | null {
    if (!doc) return null
    // older .tf domains have an iframe#pdf, .st domains an embed#pdf, and the
    // .ru domain (2026) a citation_pdf_url meta, an <object> and a download link
    const rawUrl = doc.querySelector('#pdf')?.getAttribute('src')
      ?? doc.querySelector('meta[name="citation_pdf_url"]')?.getAttribute('content')
      ?? doc.querySelector('object[type="application/pdf"]')?.getAttribute('data')
      ?? doc.querySelector('.download a')?.getAttribute('href')
    if (!rawUrl) return null
    // Resolve relative and protocol-relative ("//host/file.pdf") urls against the page
    return new URL(rawUrl, baseUrl).href
  }

  private isCaptchaPage(body: HTMLBodyElement | null | undefined): boolean {
    // sci-hub.ru serves an ALTCHA "are you a robot?" page (a "question" with a
    // single "answer" button) before giving the PDF. The article page also embeds
    // an altcha-widget (in its "report a problem" form), so the widget alone is not a sign
    return !!body?.querySelector('.question .answer')
  }

  private isPdfNotAvailable(body: HTMLBodyElement | null | undefined): boolean {
    const innerHTML = body?.innerHTML
    // older .tf domain return rich error message
    // newer .st domains return empty page if pdf is not available
    // sci-hub.ru (2026) answers a 200 page "статья отсутствует в базе" (article not in
    // the database) for papers published after 2021, pointing to Sci-Net
    if (!innerHTML || innerHTML?.trim() === '' ||
      innerHTML?.match(/Please try to search again using DOI/im) ||
      innerHTML?.match(/статья не найдена в базе/im) ||
      innerHTML?.match(/(отсутствует|нет) в (моей )?базе/im)) {
      return true
    }
    return false
  }

  private hasPdfAttachment(item: ZoteroItem): boolean {
    return Zotero.Items.get(item.getAttachments()).some(attachment => attachment.isPDFAttachment())
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
    const match = extra?.match(/^DOI: (.+)$/m)
    if (match) {
      return match[1]
    }
    return null
  }

  private getDoiFromUrl(item: ZoteroItem): string | null {
    // If item was added by the doi.org url it can be extracted from its pathname
    const url = item.getField('url')
    const isDoiOrg = url?.match(/\bdoi\.org\b/i)
    if (isDoiOrg) {
      const doiPath = new URL(url).pathname
      return decodeURIComponent(doiPath).replace(/^\//, '')
    }
    return null
  }
}

Zotero.Scihub = new Scihub()

export { Scihub }
