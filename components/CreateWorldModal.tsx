import React, { useState, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';
import D20Icon from './icons/D20Icon';

interface CreateWorldModalProps {
  onClose: () => void;
  onCreate: (name: string, files: File[]) => Promise<void>;
}

const CreateWorldModal: React.FC<CreateWorldModalProps> = ({ onClose, onCreate }) => {
  const [worldName, setWorldName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  }, []);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
    } else if (e.type === "dragleave") {
        setIsDragging(false);
    }
  };

  const handleSubmit = async () => {
    if (!worldName.trim() || isCreating) return;
    setIsCreating(true);
    await onCreate(worldName, files);
    // isCreating will be false when the component unmounts after creation.
  };
  
  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };


  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Create a New World</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="World Name (e.g., 'The Ashen Isles')"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={isCreating}
          />

          <div 
            onDrop={handleDrop} 
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".txt,.md,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              disabled={isCreating}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadIcon className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">TXT, MD, PNG, or JPG files</p>
              <p className="text-xs text-gray-500">(Optional - for AI-generated lore)</p>
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {files.map((file, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700/50 p-2 rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <button onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-400 text-xs ml-2">&times;</button>
                    </div>
                ))}
            </div>
          )}

        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!worldName.trim() || isCreating}
            className="w-40 flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <D20Icon className="h-5 w-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : 'Create World'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorldModal;
