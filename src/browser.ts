export const inject = (css: string) => {
  return `const style = document.createElement('style')
          document.head.appendChild(style)
          style.sheet.insertRule(\`${css}\`)
          `
}