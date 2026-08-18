'use client';

import React from 'react';
import { OperationTimeHistoryEntry } from '@/types/production';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface SparklineProps {
  history?: OperationTimeHistoryEntry[];
  currentTime: number;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const Sparkline: React.FC<SparklineProps> = ({
  history,
  currentTime,
  width = 90,
  height = 28,
  onClick
}) => {
  // Normalize data points
  const points: number[] = React.useMemo(() => {
    if (!history || history.length === 0) {
      // Single baseline point
      return [currentTime, currentTime];
    }
    if (history.length === 1) {
      return [history[0].time, currentTime];
    }
    const times = history.map(h => h.time);
    // Ensure the last point is current time
    if (times[times.length - 1] !== currentTime) {
      times.push(currentTime);
    }
    return times;
  }, [history, currentTime]);

  const firstVal = points[0];
  const lastVal = points[points.length - 1];
  const diff = lastVal - firstVal;
  const pctChange = firstVal > 0 ? (diff / firstVal) * 100 : 0;

  // In production time, a DECREASE is good (Efficiency Gain = Green)
  // An INCREASE is bad (Worse Efficiency = Red)
  const isImproved = diff < -0.01;
  const isWorse = diff > 0.01;

  const strokeColor = isImproved
    ? '#10b981' // emerald-500
    : isWorse
    ? '#f43f5e' // rose-500
    : '#06b6d4'; // cyan-500

  const fillColor = isImproved
    ? 'rgba(16, 185, 129, 0.15)'
    : isWorse
    ? 'rgba(244, 63, 94, 0.15)'
    : 'rgba(6, 182, 212, 0.15)';

  // Build SVG Path
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const valRange = maxVal - minVal || 1;
  const padX = 4;
  const padY = 4;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const coords = points.map((val, idx) => {
    const x = padX + (idx / (points.length - 1 || 1)) * chartW;
    const y = padY + chartH - ((val - minVal) / valRange) * chartH;
    return { x, y };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
  const lastCoord = coords[coords.length - 1];

  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm"
      title="Clique para ver o gráfico de evolução histórica do tempo desta operação"
    >
      {/* Mini SVG Sparkline */}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${firstVal}-${lastVal}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        <path d={areaD} fill={`url(#grad-${firstVal}-${lastVal})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last Point Dot */}
        <circle
          cx={lastCoord.x}
          cy={lastCoord.y}
          r="2.5"
          fill={strokeColor}
          className="group-hover:scale-125 transition-transform"
        />
      </svg>

      {/* Delta Tag */}
      <div className="flex items-center text-[10px] font-mono font-bold shrink-0">
        {isImproved ? (
          <span className="text-emerald-400 flex items-center">
            <TrendingDown className="w-3 h-3 mr-0.5" />
            {Math.abs(pctChange).toFixed(0)}%
          </span>
        ) : isWorse ? (
          <span className="text-rose-400 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            +{pctChange.toFixed(0)}%
          </span>
        ) : (
          <span className="text-slate-400 flex items-center">
            <Minus className="w-3 h-3 mr-0.5" />
            0%
          </span>
        )}
      </div>
    </div>
  );
};
