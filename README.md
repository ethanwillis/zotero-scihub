# Note/News:
I've been away from any open source work for a while. I also have had issues with my Github account for a while. However!, I know a lot of people like this plugin and have posted a lot of ideas/errors in the issues. 

#### I will be spending a good amount of time to update the plugin, instructions, deal with outstanding errors, and begin adding features that have been requested. 
If you have a specific issue that is important to you please add any kind of "reaction" to the first comment in that issue and/or a comment of your own(if you have something important to add). 
If I notice that an issue has a lot of activity, then I will try to prioritize that work first. 

As well, if you are a Twitter user. Feel free to [follow me](https://twitter.com/ELWillis10). My private messages are always open if you want to contact me for whatever reason. 

Thanks everyone for all the interest and nice comments over the years :)

--Ethan

# Zotero Scihub

This is an add-on for [Zotero](https://www.zotero.org/) and [Juris-M](https://juris-m.github.io/) that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install

- Download the latest release (.xpi file) from the [Releases Page](https://github.com/ethanwillis/zotero-scihub/releases)
  _Note_ If you're using Firefox as your browser, right click the xpi and select "Save As.."
- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.
- Restart Zotero, by clicking "restart now" in the extensions list where the
  scihub plugin is now listed.

#### Usage

Once you have the plugin installed simply, right click any item in your collections.
There will now be a new context menu option titled "Update Scihub PDF." Once you
click this, a PDF of the file will be downloaded from Scihub and attached to your
item in Zotero.

For any new papers you add after this plugin is installed, the scihub pdf will be
automatically downloaded.

#### Configuration

Plugin is configured through the dedicated tab: 

<img width="782" alt="Screenshot 2021-08-21 at 22 14 04" src="https://user-images.githubusercontent.com/387791/130333778-8bfb0878-2122-49a9-bc23-c528eb9b6cbf.png">

#### DNS-over-HTTPS

In case of malfunctioning or unsafe local DNS server, Zotero (as it's built on Firefox) might be configured with [Trusted Recursive Resolver](https://wiki.mozilla.org/Trusted_Recursive_Resolver) or DNS-over-HTTPS, where you could set your own DNS server just for Zotero without modifying network settings.

_Preferences > Advanced > Config Editor_

1. set `network.trr.mode` to `2` or `3`, this enables DNS-over-HTTPS (2 enables it with fallback)
2. set `network.trr.uri` to `https://cloudflare-dns.com/dns-query`, this is the provider’s URL
3. set `network.trr.bootstrapAddress` to `1.1.1.1`, this is cloudflare’s normal DNS server (only) used to retrieve the IP of cloudfaire-dns.com
4. Restart zotero, wait for a DNS cache to clean up.

## Building

0. Pre-requisite is to have [node.js](nodejs.org) installed
1. Install dependencies `npm install`
2. Build `npm run build`

## [Contributing](./CONTRIBUTING.md)

## Disclaimer

Use this code at your own peril. No warranties are provided. Keep the laws of your locality in mind!
