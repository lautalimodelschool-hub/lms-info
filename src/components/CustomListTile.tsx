import React, { useState } from 'react';
import { getInitials, formatCallLink, formatWhatsAppLink } from '../lib/utils';
import { Phone, MessageCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomListTileProps {
  name: string;
  subtitle: string;
  phone: string;
  photo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showAdminActions?: boolean;
  onContactClick?: (e: React.MouseEvent) => void;
  details?: Record<string, any>;
  isRestricted?: boolean;
  onRestrictedAction?: (e: React.MouseEvent) => void;
  onReport?: () => void;
}

export const CustomListTile: React.FC<CustomListTileProps> = ({
  name,
  subtitle,
  phone,
  photo,
  onEdit,
  onDelete,
  showAdminActions = false,
  onContactClick,
  details,
  isRestricted = false,
  onRestrictedAction,
  onReport,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Filter out empty details and objects
  const validDetails = details 
    ? Object.entries(details).filter(([_, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    : [];

  const hasDetails = validDetails.length > 0;

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasDetails && !isRestricted) {
      setExpanded(!expanded);
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    if (isRestricted && onRestrictedAction) {
      e.preventDefault();
      e.stopPropagation();
      onRestrictedAction(e);
      return;
    }
    if (onContactClick) {
      onContactClick(e);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-2xl mb-3 shadow-sm border border-[var(--card-border)] overflow-hidden transition-all">
      <div 
        className={`p-4 flex items-center ${hasDetails && !isRestricted ? 'cursor-pointer select-none' : ''}`}
        onClick={handleCardClick}
      >
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold overflow-hidden shrink-0">
          {photo ? (
            <img 
              src={photo} 
              alt={name || 'User'} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                if ((e.target as HTMLImageElement).parentElement) {
                  (e.target as HTMLImageElement).parentElement!.innerText = getInitials(name || 'User');
                }
              }}
            />
          ) : (
            getInitials(name || 'User')
          )}
        </div>
        
        <div className="ml-4 flex-1 min-w-0 py-1">
          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onReport && (
            <button 
              onClick={onReport}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              title="Report Wrong Info"
            >
              <Flag size={14} />
            </button>
          )}
          {showAdminActions && (
            <>
              <button 
                onClick={onEdit}
                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button 
                onClick={onDelete}
                className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </>
          )}
          {phone && (
            <>
              <a
                href={isRestricted ? '#' : formatWhatsAppLink(phone)}
                target={isRestricted ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={handleContactClick}
                className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href={isRestricted ? '#' : formatCallLink(phone)}
                onClick={handleContactClick}
                className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400"
              >
                <Phone size={18} />
              </a>
            </>
          )}
          {hasDetails && !isRestricted && (
            <div 
              className="w-8 h-8 flex items-center justify-center text-slate-400 ml-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--card-border)] bg-[var(--secondary)]/50"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
              {validDetails.map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">{key}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white break-words">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
