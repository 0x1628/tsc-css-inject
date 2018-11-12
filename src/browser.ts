export const inject = (css: string) => {
  return `const style = document.createElement('style')
          style.innerHTML = \`${css}\`
          document.head.appendChild(style)
          `
}