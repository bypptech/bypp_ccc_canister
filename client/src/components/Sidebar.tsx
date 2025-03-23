import { useState } from 'react';
import { ChevronLeft, Home, FileText, Settings, User } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-14 bg-dark-200 flex flex-col items-center py-4 border-r border-dark-100">
      <div className="mb-6">
        <div 
          className="w-8 h-8 rounded-md bg-[#FFC131] flex items-center justify-center cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className="w-5 h-5 text-dark-300" />
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-6 flex-grow">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-8 h-8 text-light-100 flex items-center justify-center cursor-pointer hover:text-[#FFC131] transition-colors">
                <Home className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-8 h-8 text-light-100 flex items-center justify-center cursor-pointer hover:text-[#FFC131] transition-colors border-l-2 border-[#FFC131]">
                <FileText className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Files</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-8 h-8 text-light-100 flex items-center justify-center cursor-pointer hover:text-[#FFC131] transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-100 cursor-pointer">
          <div className="w-full h-full flex items-center justify-center text-light-100">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
