const fs = require('fs')
const path = require('path')
const { version } = require('../package.json')

const src = path.join(
  __dirname, '..', 'src-tauri', 'target', 'x86_64-pc-windows-gnu',
  'release', 'bundle', 'nsis', `Take A Moment_${version}_x64-setup.exe`
)
const dest = path.join(__dirname, '..', 'release', `Take A Moment Setup ${version}.exe`)

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log(`Installer copied to release/Take A Moment Setup ${version}.exe`)
