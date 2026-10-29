import React from 'react';
import { RiskLevel } from '../../types/ppic';
import { CheckCircle2, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (level) {
    case 'READY':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800 ${sizeClasses[size]}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-emerald-600 shrink-0`} />}
          <span className="tracking-wide">READY</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses[size]}`}
        >
          {showIcon && <AlertTriangle className={`${iconSizes[size]} text-amber-600 shrink-0`} />}
          <span className="tracking-wide">MEDIUM RISK</span>
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-orange-300 bg-orange-50 text-orange-800 ${sizeClasses[size]}`}
        >
          {showIcon && <AlertOctagon className={`${iconSizes[size]} text-orange-600 shrink-0`} />}
          <span className="tracking-wide">HIGH RISK</span>
        </span>
      );
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded border border-red-300 bg-red-50 text-red-800 ${sizeClasses[size]}`}
        >
          {showIcon && <Flame className={`${iconSizes[size]} text-red-600 shrink-0`} />}
          <span className="tracking-wide">CRITICAL RISK</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-slate-300 bg-slate-50 text-slate-700 ${sizeClasses[size]}`}
        >
          UNKNOWN
        </span>
      );
  }
};
