/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai'
import { spy, stub, FakeXMLHttpRequest, fakeServer } from 'sinon'
// DOMParser is requited to support sinon fake xhr document parser
import { JSDOM } from 'jsdom'
globalThis.DOMParser = new JSDOM().window.DOMParser

import { Zotero, progressWindowSpy } from './zotero.mock'
import { collectionItem, itemWithoutDOI, regularItem1, regularItem2, DOIinExtraItem, DOIinUrlItem, captchaItem, unavailableItem } from './zoteroItem.mock'
globalThis.Zotero = Zotero
// Since there is catch-all in the code which raises alerts
globalThis.alert = m => { throw new Error(m) }

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
      server.respondWith('GET', 'https://sci-hub.st/10.1037/a0023781', [
        200, { 'Content-Type': 'text/html+xml' },
        '<html><body><iframe id="pdf" src="http://example.com/regular_item_1.pdf" /></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.st/10.1029/2018JA025877', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><iframe id="pdf" src="https://example.com/doi_in_extra_item.pdf?param=val#tag" /></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.st/10.1080/00224490902775827', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><embed id="pdf" src="http://example.com/doi_in_url_item.pdf"></embed></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.st/captcha', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body>Captcha is required</body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.st/42.0/69', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body>Please try to search again using DOI</body></html>',
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

    it('captcha redirects user and stops execution', async () => {
      const launchURLSpy = spy(Zotero, 'launchURL')
      const alertStub = stub(globalThis, 'alert')

      // captachItem has weird response
      await Zotero.Scihub.updateItems([captchaItem, regularItem1])

      expect(launchURLSpy.calledOnce).to.be.true
      expect(attachmentSpy.notCalled).to.be.true

      launchURLSpy.restore()
      alertStub.restore()
    })
  })
})
