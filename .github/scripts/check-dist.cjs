#!/usr/bin/env node
// Built-package gate: every exception class in src/exception/index.ts must be exported from the
// package root, in both the CommonJS and the ESM bundle, under its own class name. Consumers
// catch these by `instanceof` and match them by `error.name`; a missing re-export or a bundler
// rename (e.g. `_SignatureMismatchException`) is invisible to the source-level test suite.
//
// Run after `npm run build`: node .github/scripts/check-dist.cjs
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const root = path.resolve(__dirname, '..', '..')
const source = fs.readFileSync(path.join(root, 'src', 'exception', 'index.ts'), 'utf8')
const names = [...source.matchAll(/export \{ default as (\w+) \}/g)].map((match) => match[1])

const failures = []
if (names.length === 0) {
  failures.push('no exception classes found in src/exception/index.ts')
}

function checkExports (label, mod) {
  for (const name of names) {
    const value = mod[name]
    if (typeof value !== 'function') {
      failures.push(`${label}: ${name} is not exported`)
    } else if (value.name !== name) {
      failures.push(`${label}: ${name} is named ${JSON.stringify(value.name)}`)
    }
  }
  const Mismatch = mod.SignatureMismatchException
  const Base = mod.BaseException
  if (typeof Mismatch === 'function' && typeof Base === 'function') {
    const error = new Mismatch()
    if (error.name !== 'SignatureMismatchException') {
      failures.push(`${label}: new SignatureMismatchException().name is ${JSON.stringify(error.name)}`)
    }
    if (!(error instanceof Base)) {
      failures.push(`${label}: SignatureMismatchException is not an instanceof BaseException`)
    }
  }
}

async function main () {
  checkExports('dist/index.cjs', require(path.join(root, 'dist', 'index.cjs')))
  checkExports('dist/index.js', await import(pathToFileURL(path.join(root, 'dist', 'index.js')).href))
  if (failures.length > 0) {
    for (const failure of failures) console.error(failure)
    process.exit(1)
  }
  console.log(`dist: ${names.length} exception classes exported with their own names`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
