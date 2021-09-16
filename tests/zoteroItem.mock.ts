import { ZoteroItem } from '../typings/zotero'

const regularItem1: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID1'
  public id = '1'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'regularItemTitle1'
      case 'DOI': return '10.1037/a0023781'
      case 'extra': return
      case 'url': return
    }
  }
}

const regularItem2: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID2'
  public id = '2'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'regularItemTitle2'
      case 'DOI': return '10.1119/1.2805241'
      case 'extra': return
      case 'url': return
    }
  }
}

const collectionItem: ZoteroItem = new class {
  public isRegularItem() { return false }
  public isCollection() { return true }
  public libraryID = 'regularItemLibraryID2'
  public id = '3'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'collectionItemTitle'
      case 'DOI': return
      case 'extra': return
      case 'url': return
    }
  }
}

const itemWithoutDOI: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID2'
  public id = '4'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'itemWithoutDOITitle'
      case 'DOI': return
      case 'extra': return
      case 'url': return
      default: return
    }
  }
}

const DOIinExtraItem: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID2'
  public id = '5'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'DOIinExtraItemTitle'
      case 'DOI': return
      case 'extra': return 'Some Field: Some Value\nDOI: 10.1029/2018JA025877'
      case 'url': return
      default: return
    }
  }
}

const DOIinUrlItem: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID2'
  public id = '6'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'DOIinUrlItemTitle'
      case 'DOI': return
      case 'extra': return
      case 'url': return 'https://doi.org/10.1080/00224490902775827'
      default: return
    }
  }
}

const captchaItem: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'regularItemLibraryID2'
  public id = '7'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'captchaItemTitle'
      case 'DOI': return 'captcha'
      case 'extra': return
      case 'url': return
      default: return
    }
  }
}

const unavailableItem: ZoteroItem = new class {
  public isRegularItem() { return true }
  public isCollection() { return false }
  public libraryID = 'unavailableItemLibraryID2'
  public id = '8'
  public getField(f: string): any {
    switch (f) {
      case 'title': return 'unavailableItemTitle2'
      case 'DOI': return '42.0/69'
      case 'extra': return
      case 'url': return
    }
  }
}

export { regularItem1, regularItem2, collectionItem, itemWithoutDOI, DOIinExtraItem, DOIinUrlItem, captchaItem, unavailableItem }
