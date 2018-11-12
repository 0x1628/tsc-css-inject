import * as path from 'path'
import {statSync} from 'fs'

export const getTsc = (target?: string): string | null => {
  if (!target) {
    target = process.cwd()
  }
  if (target === '/') return null

  const bin = path.resolve(target, 'node_modules', '.bin', 'tsc')
  try {
    const result = statSync(bin)
    if (result.isFile() || result.isSymbolicLink()) {
      return bin
    }
    return getTsc(path.resolve(target, '..'))
  } catch (e) {
    return getTsc(path.resolve(target, '..'))
  }
}