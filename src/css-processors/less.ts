import * as path from 'path'
import * as fs from 'fs'
import {Parser} from '../CSSInject'
import * as less from 'less'

export const parse: Parser = (cssPath: string, options: any) => {
  cssPath = path.resolve(options.rootDir, cssPath)
  return new Promise(resolve => {
    fs.readFile(cssPath, (err, css) => {
      less
        .render(css.toString(), {
          rootpath: options.rootDir,
        })
        .then((output: any) => {
          resolve(output.css)
        })
    })
  })
}