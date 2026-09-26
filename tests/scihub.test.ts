/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai'
import { spy, stub, createSandbox, FakeXMLHttpRequest, fakeServer } from 'sinon'
// DOMParser is requited to support sinon fake xhr document parser
import { JSDOM } from 'jsdom'
globalThis.DOMParser = new JSDOM().window.DOMParser

import { Zotero, progressWindowSpy } from './zotero.mock'
import { collectionItem, itemWithoutDOI, itemWithPdf, regularItem1, regularItem2, DOIinExtraItem, DOIinUrlItem, captchaItem, unavailableItem } from './zoteroItem.mock'
globalThis.Zotero = Zotero

import { Scihub } from '../content/scihub'
Zotero.Scihub = new Scihub()

describe('Scihub test', () => {
  describe('updateItems', () => {
    let attachmentSpy
    let server

    beforeEach(() => {
      attachmentSpy = spy(Zotero.Attachments, 'importFromURL')

      // Allows sinon to enable FakeXHR module, since xhr is not available otherwise
      globalThis.XMLHttpRequest = FakeXMLHttpRequest
      server = fakeServer.create({ respondImmediately: true })
      server.respondWith('GET', 'https://sci-hub.ru/10.1037/a0023781', [
        200, { 'Content-Type': 'text/html+xml' },
        '<html><body><iframe id="pdf" src="http://example.com/regular_item_1.pdf" /></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/10.1029/2018JA025877', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><iframe id="pdf" src="https://example.com/doi_in_extra_item.pdf?param=val#tag" /></body></html>',
      ])
      // 2026 sci-hub.ru layout: no #pdf element, citation_pdf_url meta with a protocol-relative url
      server.respondWith('GET', 'https://sci-hub.ru/10.1080/00224490902775827', [
        200, { 'Content-Type': 'application/xml' },
        '<html><head><meta name="citation_pdf_url" content="//example.com/doi_in_url_item.pdf"/></head>' +
        '<body><object type="application/pdf" data="//example.com/doi_in_url_item.pdf#view=FitH"></object>' +
        '<altcha-widget></altcha-widget></body></html>',
      ])
      // sci-hub.ru "are you a robot?" page
      server.respondWith('GET', 'https://sci-hub.ru/captcha', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><div class="question"><div class="ask">Вы робот?</div><div class="answer">Нет</div></div>' +
        '<altcha-widget></altcha-widget></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/42.0/69', [
        404, { 'Content-Type': 'application/xml' },
        '<html><body>статьи по запросу не найдены</body></html>',
      ])
      server.respondWith([
        200, { 'Content-Type': 'application/xml' },
        '   '])
    })

    afterEach(() => {
      attachmentSpy.restore()
      server.restore()
      progressWindowSpy.resetHistory()
    })

    it('does nothing if there is no items to update', async () => {
      await Zotero.Scihub.updateItems([])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('skips collection items', async () => {
      await Zotero.Scihub.updateItems([collectionItem])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('skips items without DOI', async () => {
      await Zotero.Scihub.updateItems([itemWithoutDOI])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('skips items which already have a PDF attachment', async () => {
      await Zotero.Scihub.updateItems([itemWithPdf])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('treats the "article not in the database" page as not available and tries Sci-Net', async () => {
      server.respondWith('GET', 'https://sci-hub.ru/10.1119/1.2805241', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><div class="explanation">Полного текста этой статьи нет в моей базе. Статья относительно новая</div></body></html>',
      ])
      server.respondWith('GET', 'https://sci-net.xyz/10.1119/1.2805241', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><div class="pdf"><iframe src="/storage/2024/paper.pdf"></iframe></div></body></html>',
      ])

      await Zotero.Scihub.updateItems([regularItem2])

      expect(attachmentSpy.calledOnce).to.be.true
      expect(attachmentSpy.firstCall.args[0].url).to.equal('https://sci-net.xyz/storage/2024/paper.pdf')
    })

    it('attaches PDFs to items it processes', async () => {
      await Zotero.Scihub.updateItems([regularItem1, DOIinExtraItem, DOIinUrlItem])

      expect(attachmentSpy.callCount).to.equals(3)

      expect(attachmentSpy.firstCall.args[0].url).to.equal('https://example.com/regular_item_1.pdf')
      expect(attachmentSpy.firstCall.args[0].fileBaseName).to.equal('regular_item_1.pdf')
      expect(attachmentSpy.firstCall.args[0].title).to.equal('regularItemTitle1')

      expect(attachmentSpy.secondCall.args[0].url).to.equal('https://example.com/doi_in_extra_item.pdf?param=val#tag')
      expect(attachmentSpy.secondCall.args[0].fileBaseName).to.equal('doi_in_extra_item.pdf')
      expect(attachmentSpy.secondCall.args[0].title).to.equal('DOIinExtraItemTitle')

      expect(attachmentSpy.thirdCall.args[0].url).to.equal('https://example.com/doi_in_url_item.pdf')
      expect(attachmentSpy.thirdCall.args[0].fileBaseName).to.equal('doi_in_url_item.pdf')
      expect(attachmentSpy.thirdCall.args[0].title).to.equal('DOIinUrlItemTitle')
    })

    it('unavailable item shows popup and continues execution', async () => {
      // regularItem2 has no PDF available
      await Zotero.Scihub.updateItems([regularItem2, regularItem1])

      expect(progressWindowSpy.calledWith('Error')).to.be.true
      expect(attachmentSpy.calledOnce).to.be.true
    })

    it('unavailable item with rich error message shows popup and continues execution', async () => {
      // unavailableItem has no PDF available, but reports different error
      await Zotero.Scihub.updateItems([unavailableItem, regularItem1])

      expect(progressWindowSpy.calledWith('Error')).to.be.true
      expect(attachmentSpy.calledOnce).to.be.true
    })

    it('falls back to Sci-Net when Sci-Hub does not have the PDF', async () => {
      // regularItem2 has no PDF on Sci-Hub; Sci-Net shows it in an iframe
      server.respondWith('GET', 'https://sci-net.xyz/10.1119/1.2805241', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><div class="pdf"><iframe src="/storage/2024/paper.pdf#view=FitH"></iframe></div></body></html>',
      ])

      await Zotero.Scihub.updateItems([regularItem2])

      expect(attachmentSpy.calledOnce).to.be.true
      expect(attachmentSpy.firstCall.args[0].url).to.equal('https://sci-net.xyz/storage/2024/paper.pdf#view=FitH')
      expect(attachmentSpy.firstCall.args[0].fileBaseName).to.equal('paper.pdf')
    })

    it('attaches an open-access copy when neither Sci-Hub nor Sci-Net have the PDF', async () => {
      const openAccessStub = stub(Zotero.Attachments, 'addAvailableFile').resolves(regularItem2)

      // regularItem2 is on neither site
      await Zotero.Scihub.updateItems([regularItem2])

      expect(openAccessStub.calledOnceWith(regularItem2)).to.be.true
      expect(attachmentSpy.notCalled).to.be.true
      expect(progressWindowSpy.calledWith('Error')).to.be.false

      openAccessStub.restore()
    })

    it('captcha redirects user and stops execution', async () => {
      const openInViewerSpy = spy(Zotero, 'openInViewer')
      const alertStub = stub(Zotero, 'alert')

      // captachItem has weird response
      await Zotero.Scihub.updateItems([captchaItem, regularItem1])

      expect(openInViewerSpy.calledOnce).to.be.true
      expect(attachmentSpy.notCalled).to.be.true

      openInViewerSpy.restore()
      alertStub.restore()
    })
  })

  describe("Anna's Archive selection", () => {
    let sandbox
    let originalProvider: string | number | boolean

    beforeEach(() => {
      originalProvider = Zotero.Prefs.get('zoteroscihub.provider')
      Zotero.Prefs.set('zoteroscihub.provider', 'annas-archive')
      sandbox = createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
      Zotero.Prefs.set('zoteroscihub.provider', originalProvider)
      progressWindowSpy.resetHistory()
    })

    it('keeps the scidb path, resolves redirected PDF links, and supports switching back', async () => {
      const request = sandbox.stub(Zotero.HTTP, 'request')
      request.onFirstCall().resolves({
        status: 200,
        responseURL: 'https://annas-archive.gl/redirected/10.1037/a0023781',
        responseXML: new DOMParser().parseFromString(
          '<html><body><iframe id="pdf" src="../files/paper.pdf"/></body></html>', 'text/xml'),
      })
      request.onSecondCall().resolves({
        status: 200,
        responseURL: 'https://sci-hub.ru/10.1037/a0023781',
        responseXML: new DOMParser().parseFromString(
          '<html><body><iframe id="pdf" src="/paper.pdf"/></body></html>', 'text/xml'),
      })
      const attachment = sandbox.spy(Zotero.Attachments, 'importFromURL')

      await Zotero.Scihub.updateItems([regularItem1])
      expect(request.firstCall.args[1]).to.equal('https://annas-archive.gl/scidb/10.1037/a0023781')
      expect(attachment.firstCall.args[0].url).to.equal('https://annas-archive.gl/redirected/files/paper.pdf')

      Zotero.Prefs.set('zoteroscihub.provider', 'scihub')
      await Zotero.Scihub.updateItems([regularItem1])
      expect(request.secondCall.args[1]).to.equal('https://sci-hub.ru/10.1037/a0023781')
      expect(attachment.secondCall.args[0].url).to.equal('https://sci-hub.ru/paper.pdf')
    })

    it('opens the selected provider challenge page and stops the batch', async () => {
      const request = sandbox.stub(Zotero.HTTP, 'request').resolves({
        status: 200,
        responseXML: new DOMParser().parseFromString(
          '<html><body><div class="question"><button class="answer">No</button></div></body></html>', 'text/xml'),
      })
      const viewer = sandbox.spy(Zotero, 'openInViewer')
      sandbox.stub(Zotero, 'alert')
      const attachment = sandbox.spy(Zotero.Attachments, 'importFromURL')

      await Zotero.Scihub.updateItems([regularItem1, regularItem2])

      expect(viewer.calledOnceWith('https://annas-archive.gl/scidb/10.1037/a0023781')).to.be.true
      expect(request.calledOnce).to.be.true
      expect(attachment.notCalled).to.be.true
    })

    it("retains Sci-Net fallback when Anna's Archive has no PDF", async () => {
      const request = sandbox.stub(Zotero.HTTP, 'request')
      request.onFirstCall().resolves({ status: 404 })
      request.onSecondCall().resolves({
        status: 200,
        responseURL: 'https://sci-net.xyz/10.1037/a0023781',
        responseXML: new DOMParser().parseFromString(
          '<html><body><iframe src="/storage/paper.pdf"/></body></html>', 'text/xml'),
      })
      const attachment = sandbox.spy(Zotero.Attachments, 'importFromURL')

      await Zotero.Scihub.updateItems([regularItem1])

      expect(request.secondCall.args[1]).to.equal('https://sci-net.xyz/10.1037/a0023781')
      expect(attachment.calledOnce).to.be.true
      expect(attachment.firstCall.args[0].url).to.equal('https://sci-net.xyz/storage/paper.pdf')
    })
  })
})
