/**
 * Ensures asset directories exist. Icons are committed as static files.
 */
const fs = require('fs')
const path = require('path')

const dirs = [
  path.join(__dirname, '..', 'assets', 'icons'),
  path.join(__dirname, '..', 'assets', 'sounds'),
  path.join(__dirname, '..', 'assets', 'fonts'),
]

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true })
}

console.log('Asset directories ready.')
