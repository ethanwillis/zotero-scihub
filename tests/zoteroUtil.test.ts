import { Zotero } from './zotero.mock'
import { regularItem1 } from './zoteroItem.mock'
import { ZoteroUtil } from '../content/zoteroUtil'
import { expect } from 'chai'
import { spy } from 'sinon'

globalThis.Zotero = Zotero

describe('ZoteroUtil test', () => {
  describe('attachRemotePDFToItem', () => {
    let attachmentSpy

    beforeEach(() => {
      attachmentSpy = spy(Zotero.Attachments, 'importFromURL')
    })

    afterEach(() => {
      attachmentSpy.restore()
    })

    it('should pass correct parameters to built-in Zotero method', async () => {
      const pdfUrl = new URL('https://example.com/filename.pdf')

      await ZoteroUtil.attachRemotePDFToItem(pdfUrl, regularItem1)

      expect(attachmentSpy.firstCall.args[0].url).to.equal('https://example.com/filename.pdf')
      expect(attachmentSpy.firstCall.args[0].fileBaseName).to.equal('filename.pdf')
      expect(attachmentSpy.firstCall.args[0].title).to.equal('regularItemTitle1')
    })
  })
})
