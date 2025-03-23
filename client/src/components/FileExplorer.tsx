import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash, Folder, File } from 'lucide-react';

interface FileExplorerProps {
  fileTree: any[];
  expandedFolders: string[];
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string) => void;
}

export default function FileExplorer({ 
  fileTree = [],
  expandedFolders = [],
  onToggleFolder,
  onOpenFile
}: FileExplorerProps) {
  
  const renderFileTree = (items: any[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.includes(item.path);
      const isDirectory = item.type === 'directory';
      
      const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.json')) return <File className="w-4 h-4 text-orange-400 mr-2" />;
        if (fileName.endsWith('.md')) return <File className="w-4 h-4 text-yellow-400 mr-2" />;
        if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) return <File className="w-4 h-4 text-blue-400 mr-2" />;
        return <File className="w-4 h-4 text-purple-400 mr-2" />;
      };
      
      return (
        <div key={item.path} className="mb-1">
          <div 
            className={`flex items-center px-2 py-1 rounded hover:bg-dark-100 cursor-pointer ${
              item.highlight ? 'bg-dark-100' : ''
            }`}
            onClick={() => isDirectory ? onToggleFolder(item.path) : onOpenFile(item.path)}
          >
            {isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <Folder className="w-4 h-4 text-[#24C8DB] mr-2" />
              </>
            ) : (
              getFileIcon(item.name)
            )}
            <span className="text-sm">{item.name}</span>
          </div>
          
          {isDirectory && isExpanded && item.children && item.children.length > 0 && (
            <div className="ml-4 mt-1">
              {renderFileTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-dark-200 border-r border-dark-100 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-dark-100">
        <h2 className="text-sm font-medium text-light-100">EXPLORER</h2>
        <div className="flex space-x-2">
          <button className="text-light-100 hover:text-[#FFC131] transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-light-100 hover:text-[#FFC131] transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="text-light-100 hover:text-[#FFC131] transition-colors">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-2 overflow-y-auto flex-grow custom-scrollbar">
        {renderFileTree(fileTree)}
      </div>
    </div>
  );
}
