import { X } from 'lucide-react';

interface Tab {
  name: string;
  path: string;
  active: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  onTabClick: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export default function TabBar({ tabs = [], onTabClick, onCloseTab }: TabBarProps) {
  const handleClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    onCloseTab(path);
  };

  return (
    <div className="flex bg-dark-200 border-b border-dark-100 overflow-x-auto">
      <div className="flex">
        {tabs.map(tab => (
          <div 
            key={tab.path}
            className={`px-4 py-2 border-r border-dark-100 flex items-center text-sm cursor-pointer ${
              tab.active ? 'bg-dark-300' : 'text-light-300 hover:text-light-100'
            }`}
            onClick={() => onTabClick(tab.path)}
          >
            <span>{tab.name}</span>
            <button 
              className="ml-2 text-light-300 hover:text-light-100"
              onClick={(e) => handleClose(e, tab.path)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
