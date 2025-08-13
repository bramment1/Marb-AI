export function inferIntent(prompt: string): string[] {
  return prompt.includes('route') ? ['express-route'] : ['react-component'];
}
