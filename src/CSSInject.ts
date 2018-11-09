import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {inject} from './browser'

type InjectItems = ReadonlyArray<string>
type Options = {}
export type Parser = (cssPath: string, options: any) => Promise<any>

export class CSSInject {
  static queue: CSSInject[] = []
  static directiveRe = /<css-inject path="(.+?)"/
  static parser: Parser
  static clean() {
    if (CSSInject.queue.length) {
      CSSInject.queue.forEach(i => i.cancel())
      CSSInject.queue.length = 0
    }
  }
  static init(items: InjectItems, options: any): CSSInject[] {
    CSSInject.clean()
    CSSInject.queue = items.map(fPath => new CSSInject(fPath, options))
    return Array.from(CSSInject.queue)
  }
  static use(p: Parser) {
    CSSInject.parser = p
  }

  private searchEnd = false
  private fpath = ''
  private stream: fs.ReadStream | undefined
  private rl: readline.ReadLine | undefined
  private targetCSS: string[] = []
  private targetCSSMap: Map<string, string> = new Map()
  private options: any

  constructor(fpath: string, options: any) {
    this.fpath = fpath
    this.options = options
    this.parse()
  }

  parse() {
    const inputStream = this.stream = fs.createReadStream(this.fpath)
    const rl = this.rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    })
    rl.on('line', (line: string) => {
      // only top directive will parse
      if (!line.startsWith('///')) {
        this.close()
        return
      }
      const result = CSSInject.directiveRe.exec(line)
      if (result) {
        this.targetCSS.push(result[1])
      }
    })
  }

  close() {
    this.stream!.close()
    this.rl!.close()
    if (!this.targetCSS.length) {
      this.searchEnd = true
    } else {
      Promise.all(this.targetCSS.map(p => CSSInject.parser(p, this.options))).then((css: string[]) => {
        this.targetCSS.forEach((p, index) => {
          this.targetCSSMap.set(p, css[index])
        })
        this.searchEnd = true
      })
    }
  }

  cancel() {
    this.targetCSS.length = 0
    this.close()
  }

  write(): Promise<any> {
    if (this.searchEnd && !this.targetCSS.length) {
      return Promise.resolve()
    }
    if (!this.searchEnd) {
      return new Promise(resolve => {
        setImmediate(() => { resolve(this.write()) })
      })
    }
    for (const [target, css] of this.targetCSSMap) {
      const distPath = this.fpath
        .replace(this.options.rootDir, this.options.outDir)
        .replace(/\.tsx?$/, '.js')

      fs.writeFileSync(distPath, inject(css), {
        flag: 'a',
      })
    }
    // tslint:disable-next-line
    console.log('css injected')
    return Promise.resolve()
  }
}