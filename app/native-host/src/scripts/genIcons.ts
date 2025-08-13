import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sizes = [16, 48, 128];
const src = path.resolve(__dirname, '../../../extension/assets-src/icon.svg');
const outDir = path.resolve(__dirname, '../../../extension/public');

async function main(){
  for(const s of sizes){
    const out = path.join(outDir, `icon${s}.png`);
    const buf = await sharp(src).resize(s, s).png().toBuffer();
    fs.writeFileSync(out, buf);
  }
}
main().catch(err => { console.error(err); process.exit(1); });
