import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// This component serves as a container for notifications
// In the actual implementation, toast notifications will be managed by the toast system
export default function Notification() {
  return null; // Using the default toast system
}

// For reference, here's how a custom notification component would look
export function CustomNotification({ 
  type = 'success', 
  message = '', 
  visible = false,
  onClose
}: {
  type?: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(visible);
  
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);
  
  if (!isVisible) return null;
  
  const bgColor = 
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600';
    
  const Icon = 
    type === 'success' ? CheckCircle :
    type === 'error' ? AlertCircle :
    Info;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 transform translate-y-0 opacity-100">
      <div className={`${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center`}>
        <Icon className="w-5 h-5 mr-2" />
        <span>{message}</span>
        <button className="ml-4 text-white opacity-70 hover:opacity-100" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
