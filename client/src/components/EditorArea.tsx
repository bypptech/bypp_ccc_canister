import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface EditorAreaProps {
  content: string;
  isLoading: boolean;
}

export default function EditorArea({ content = '', isLoading = false }: EditorAreaProps) {
  const [lineCount, setLineCount] = useState(1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  
  useEffect(() => {
    if (content) {
      setLineCount(content.split('\n').length);
    }
  }, [content]);
  
  // Syntax highlighting helper (very simple version)
  const highlightSyntax = (code: string) => {
    if (!code) return null;
    
    // Split the code into lines for proper rendering
    const lines = code.split('\n');
    
    return lines.map((line, i) => {
      // Very basic highlighting (a production app would use a proper syntax highlighter)
      const highlightedLine = line
        // Keywords
        .replace(/\b(import|export|from|const|let|var|function|return|if|else|try|catch|finally|async|await|for|while|class|extends|new)\b/g, '<span class="text-purple-400">$1</span>')
        // Strings
        .replace(/(['"`])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        // Comments
        .replace(/\/\/(.*)/g, '<span class="text-gray-500">\/\/$1</span>')
        // JSX elements
        .replace(/(&lt;\/?[a-zA-Z][\w.-]*)/g, '<span class="text-orange-400">$1</span>')
        // Attributes
        .replace(/([a-zA-Z][\w.-]*)=/g, '<span class="text-yellow-400">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');
      
      return (
        <div key={i} className="whitespace-pre">
          <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFC131] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono text-sm">
        <pre className="text-light-100">
          {content ? highlightSyntax(content) : 'No file open'}
        </pre>
      </div>
      
      {/* Status bar */}
      <div className="border-t border-dark-100 bg-dark-200 text-sm px-4 py-1 text-light-300 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>JavaScript React</span>
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            Tauri v1.4
          </span>
        </div>
      </div>
    </div>
  );
}
