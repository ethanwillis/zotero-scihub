export abstract class UrlUtil {
  public static urlToHttps(url: string): URL {
    // Default to the secure connection for fetching PDFs
    // Handles special case if URL starts with "//"
    const safeUrl = new URL(url.replace(/^\/\//, 'https://'))
    safeUrl.protocol = 'https'
    return safeUrl
  }

  public static extractFileNameFromUrl(url: URL): string | undefined {
    // Keeps the last token of the pathname supposing it is filename, eg
    // https://example.com/path/<filename.pdf>?params
    return url.pathname.split('/').pop()
  }
}
