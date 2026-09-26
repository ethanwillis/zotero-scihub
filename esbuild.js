const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const AdmZip = require('adm-zip')

const pkg = require('./package.json')
const buildDir = path.join(__dirname, 'build')
const xpiName = `zotero-scihub-${pkg.version}.xpi`

function copy(src, dest = src) {
  fs.cpSync(path.join(__dirname, src), path.join(buildDir, dest), { recursive: true })
}

async function build() {
  fs.rmSync(buildDir, { recursive: true, force: true })
  fs.mkdirSync(buildDir, { recursive: true })

  await esbuild.build({
    bundle: true,
    format: 'iife',
    target: ['firefox115'],
    entryPoints: ['content/scihub.ts'],
    outdir: 'build/addon/content',
  })

  const manifest = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8').replace('__VERSION__', pkg.version)
  fs.writeFileSync(path.join(buildDir, 'addon/manifest.json'), manifest)
  copy('bootstrap.js', 'addon/bootstrap.js')
  copy('prefs.js', 'addon/prefs.js')
  copy('content/preferences.xhtml', 'addon/content/preferences.xhtml')
  copy('locale', 'addon/locale')
  copy('skin', 'addon/skin')

  const zip = new AdmZip()
  zip.addLocalFolder(path.join(buildDir, 'addon'))
  zip.writeZip(path.join(buildDir, xpiName))

  const { id, strict_min_version, strict_max_version } = JSON.parse(manifest).applications.zotero
  const update = {
    addons: {
      [id]: {
        updates: [{
          version: pkg.version,
          update_link: `https://github.com/ethanwillis/zotero-scihub/releases/download/v${pkg.version}/${xpiName}`,
          applications: { zotero: { strict_min_version, strict_max_version } },
        }],
      },
    },
  }
  fs.writeFileSync(path.join(buildDir, 'update.json'), `${JSON.stringify(update, null, 2)}\n`)
  console.log(`built build/${xpiName}`)
}

build().catch(err => {
  console.log(err)
  process.exit(1)
})
