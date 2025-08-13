import React from 'react';
import FolderPicker from './components/FolderPicker';
import PromptEditor from './components/PromptEditor';
import PromptSuggestions from './components/PromptSuggestions';
import DiffViewer from './components/DiffViewer';
import TestResults from './components/TestResults';
import StatusBar from './components/StatusBar';

const App: React.FC = () => {
  return (
    <div className="flex h-screen text-sm text-white bg-gray-900">
      <div className="w-1/4 border-r border-gray-700 p-2 overflow-auto">
        <FolderPicker />
      </div>
      <div className="w-1/2 border-r border-gray-700 p-2 overflow-auto">
        <PromptEditor />
        <PromptSuggestions />
      </div>
      <div className="w-1/4 p-2 overflow-auto">
        <DiffViewer />
        <TestResults />
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
