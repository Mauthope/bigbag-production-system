'use client';

import React from 'react';
import { OperationTimeHistoryEntry } from '@/types/production';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface SparklineProps {
  history?: OperationTimeHistoryEntry[];
  previousTime?: number;
  currentTime: number;
  baselineTime?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const Sparkline: React.FC<SparklineProps> = ({
  history,
  previousTime,
  currentTime,
  baselineTime,
  width = 90,
  height = 28,
  onClick
}) => {
  // Normalize data points starting always from baselineTime
  const points: number[] = React.useMemo(() => {
    const raw: number[] = [];

    // 1. Sempre partir do tempo inicial da baseline
    if (baselineTime !== undefined && baselineTime !== null && !isNaN(baselineTime)) {
      raw.push(Number(baselineTime));
    }

    // 2. Adicionar histórico cronológico de medições
    if (history && history.length > 0) {
      history.forEach(h => {
        const val = Number(h.time);
        if (!isNaN(val)) {
          // Se o primeiro item do histórico for igual à baseline já inserida, não duplica
          if (raw.length === 1 && Math.abs(val - raw[0]) < 0.0001) {
            return;
          }
          raw.push(val);
        }
      });
    } else if (previousTime !== undefined && previousTime !== null && !isNaN(previousTime)) {
      if (raw.length === 0 || Math.abs(previousTime - raw[0]) > 0.0001) {
        raw.push(Number(previousTime));
      }
    }

    // 3. Garantir o tempo atual no final da trajetória
    if (raw.length === 0) {
      raw.push(Number(currentTime));
    }
    const lastPoint = raw[raw.length - 1];
    if (Math.abs(lastPoint - currentTime) > 0.0001) {
      raw.push(Number(currentTime));
    }

    // Se tiver apenas 1 ponto (ex: baseline == currentTime sem histórico), duplica para desenhar a linha reta
    if (raw.length === 1) {
      raw.push(raw[0]);
    }

    return raw;
  }, [history, previousTime, currentTime, baselineTime]);

  const firstVal = points[0];
  const lastVal = points[points.length - 1];
  const maxVal = Math.max(...points);
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

  // Build SVG Path
  const minVal = Math.min(...points);
  const valRange = maxVal - minVal || 1;
  const padX = 5;
  const padY = 5;
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
  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];

  const tooltipTitle = points.length > 2
    ? `Trajetória: Baseline (${firstVal.toFixed(2)}m) → Pico (${maxVal.toFixed(2)}m) → Atual (${lastVal.toFixed(2)}m) | Variação vs Baseline: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}m (${diff >= 0 ? '+' : ''}${pctChange.toFixed(0)}%)`
    : `Trajetória: Baseline (${firstVal.toFixed(2)}m) → Atual (${lastVal.toFixed(2)}m) | Variação: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}m (${diff >= 0 ? '+' : ''}${pctChange.toFixed(0)}%)`;

  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm"
      title={tooltipTitle}
    >
      {/* Mini SVG Sparkline */}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${firstVal}-${lastVal}-${width}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        <path d={areaD} fill={`url(#grad-${firstVal}-${lastVal}-${width})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Starting Dot (Baseline) */}
        {points.length > 1 && (
          <circle
            cx={firstCoord.x}
            cy={firstCoord.y}
            r="2"
            fill="#94a3b8"
            className="opacity-75"
          />
        )}

        {/* Ending Dot (Current Time) */}
        <circle
          cx={lastCoord.x}
          cy={lastCoord.y}
          r="2.5"
          fill={strokeColor}
          className="group-hover:scale-125 transition-transform"
        />
      </svg>

      {/* Delta Tag vs Baseline */}
      <div className="flex items-center text-[10px] font-mono font-bold shrink-0">
        {isImproved ? (
          <span className="text-emerald-400 flex items-center" title="Tempo reduzido em relação à baseline">
            <TrendingDown className="w-3 h-3 mr-0.5" />
            {Math.abs(pctChange).toFixed(0)}%
          </span>
        ) : isWorse ? (
          <span className="text-rose-400 flex items-center" title="Tempo superior à baseline">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            +{pctChange.toFixed(0)}%
          </span>
        ) : (
          <span className="text-slate-400 flex items-center" title="Tempo alinhado à baseline">
            <Minus className="w-3 h-3 mr-0.5" />
            0%
          </span>
        )}
      </div>
    </div>
  );
};
