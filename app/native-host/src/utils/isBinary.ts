const binaryExt = /\.(png|jpe?g|gif|ico|webp|zip|pdf|woff2?|ttf|eot|mp4|mov|avi|wav|mp3)$/i;

export function isBinaryPath(p: string): boolean {
  return binaryExt.test(p);
}
