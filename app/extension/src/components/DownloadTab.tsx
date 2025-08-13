import React from 'react';
import { call } from '../lib/rpc';

const DownloadTab: React.FC = () => {
  const [zip, setZip] = React.useState<string | null>(null);
  const handle = async () => {
    const res = await call<{ zipBase64: string }>('project/zip');
    setZip(res.zipBase64);
  };
  return (
    <div className="p-2">
      <button onClick={handle} className="mb-2 px-2 py-1 bg-gray-700 text-white">Maak download</button>
      {zip && (
        <a
          href={`data:application/zip;base64,${zip}`}
          download="project.zip"
          className="underline text-blue-400"
        >Download</a>
      )}
    </div>
  );
};

export default DownloadTab;
