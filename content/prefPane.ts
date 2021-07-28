import type { IZotero } from '../typings/zotero'
declare const Zotero: IZotero

class PrefPane {
  public initPreferences(): void {
    const automaticPdfDownloadCheckbox = document.getElementById('id-zoteroscihub-automatic-pdf-download') as HTMLInputElement
    automaticPdfDownloadCheckbox.checked = Zotero.Scihub.isAutomaticPdfDownload()

    const sciHubUrlInput = document.getElementById('id-zoteroscihub-scihub-url') as HTMLInputElement
    sciHubUrlInput.value = Zotero.Scihub.getBaseScihubUrl()
  }
}

export { PrefPane }
