import { Project, ScriptKind } from 'ts-morph';

export function astTransforms(files: { path: string; content: string }[]) {
  const project = new Project();
  return files.map(f => {
    const sf = project.createSourceFile(f.path, f.content, { scriptKind: ScriptKind.TS, overwrite: true });
    sf.addStatements('// transformed');
    return { path: f.path, content: sf.getFullText() };
  });
}
