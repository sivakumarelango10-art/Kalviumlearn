import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-zinc-200">
      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-4 border border-zinc-100">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-zinc-900 mb-1">{title}</h4>
      {description && <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
