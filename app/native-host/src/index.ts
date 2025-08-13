import { improve } from './promptImprove.js';
import { runPipeline } from './generator/runPipeline.js';
import { preview } from './codeApply.js';
import { zipProject } from './zipService.js';
import { PreviewItem } from './types.js';

interface RPCReq {
  id: number;
  method: string;
  params: any;
}

process.stdin.on('data', async chunk => {
  const req: RPCReq = JSON.parse(chunk.toString());
  if (req.method === 'prompt/improve') {
    const res = improve(req.params.raw);
    respond(req.id, res);
  } else if (req.method === 'generator/plan') {
    const res: PreviewItem[] = await runPipeline(req.params.improvedPrompt);
    respond(req.id, res);
  } else if (req.method === 'plan/preview') {
    const diffs: PreviewItem[] = req.params.files.map((f: any) => preview(f.path, f.content));
    respond(req.id, diffs);
  } else if (req.method === 'project/zip') {
    const base64 = zipProject(req.params.paths);
    respond(req.id, { zipBase64: base64 });
  } else {
    respond(req.id, { error: 'not found' });
  }
});

function respond(id: number, result: any) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }));
}
