import React from 'react';
import { PreviewItem } from '../lib/types';

interface Props {
  items?: PreviewItem[];
}

const DiffViewer: React.FC<Props> = ({ items = [] }) => {
  const [filter, setFilter] = React.useState<'all' | 'text' | 'binary'>('all');
  const filtered = items.filter(i => filter === 'all' || i.kind === filter);
  return (
    <div>
      <div className="mb-2 space-x-2">
        {['all', 'text', 'binary'].map(f => (
          <button key={f} className="px-1" onClick={() => setFilter(f as any)}>{f}</button>
        ))}
      </div>
      {filtered.map(item => item.kind === 'text' ? (
        <pre key={item.path} className="bg-gray-900 text-white p-2 overflow-auto">{item.diff}</pre>
      ) : (
        <div key={item.path} className="border p-2 mb-2">
          <strong>Binary file</strong>
          <div>{item.path} ({item.status})</div>
          {item.sizeBefore !== undefined && item.sizeAfter !== undefined && (
            <div>{item.sizeBefore} → {item.sizeAfter} bytes</div>
          )}
          <label className="block mt-1"><input type="checkbox" className="mr-1" />Apply</label>
        </div>
      ))}
    </div>
  );
};

export default DiffViewer;
