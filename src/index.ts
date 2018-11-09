import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import {exec} from 'child_process'
import {CSSInject} from './CSSInject'
import {parse} from './css-processors/less'
// tslint:disable-next-line
import debounce = require('lodash.debounce')

const base = process.cwd()
const configPath = ts.findConfigFile(
  base,
  ts.sys.fileExists,
  'tsconfig.json',
)

if (!configPath) {
  console.error('can\'t find tsconfig.json')
  process.exit(1)
}

const {compilerOptions} = JSON.parse(fs.readFileSync(configPath!).toString())
CSSInject.use(parse)

const config = {
  rootDir: path.resolve(base, compilerOptions.rootDir || 'src'),
  outDir: path.resolve(base, compilerOptions.outDir || 'dist'),
}

function findTarget(baseDir: string) {
  let result: string[] = []
  const files = fs.readdirSync(baseDir, {withFileTypes: true})

  files.forEach(f => {
    if (f.isFile() && /\.tsx?$/.test(f.name)) {
      result.push(path.resolve(baseDir, f.name))
    } else if (f.isDirectory()) {
      result = result.concat(findTarget(path.resolve(baseDir, f.name)))
    }
  })
  return result
}

export function compile() {
  const targets = findTarget(config.rootDir)

  const injections = CSSInject.init(targets, config)
  exec('tsc -p .', {
    cwd: base,
  }, (err, stdout) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    Promise.all(injections.map(item => item.write()))
      .then(() => {
        // tslint:disable-next-line
        console.log('compiled\n')
      })
  })
}

export function watchCompile() {
  compile()
  fs.watch(config.rootDir, {
    recursive: true,
  }, debounce(() => {
    // tslint:disable-next-line
    console.log('recompile')
    compile()
  }, 100))
}