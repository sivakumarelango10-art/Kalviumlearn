import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  highlight = false
}) => {
  return (
    <div className={clsx(
      "p-6 rounded-xl border transition-all duration-200 bg-white",
      highlight ? "border-[#EE3124]/40 shadow-sm ring-1 ring-[#EE3124]/20" : "border-zinc-200 hover:border-zinc-300"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</span>
        {Icon && (
          <div className={clsx(
            "p-2 rounded-lg",
            highlight ? "bg-red-50 text-[#EE3124]" : "bg-zinc-50 text-zinc-600 border border-zinc-100"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-zinc-950 tracking-tight">{value}</span>
        {trend && (
          <span className={clsx(
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            trendPositive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
          )}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
