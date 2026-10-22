import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Scatter
} from 'recharts';

// High-contrast, vibrant unique colors for up to 20+ distinct stocks
const COLORS = [
  '#3b82f6', // Bright Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber / Orange
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#e11d48', // Crimson Red
  '#84cc16', // Lime Green
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#f97316', // Bright Orange
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#eab308', // Gold Yellow
  '#0ea5e9', // Sky Blue
  '#22c55e', // Green
  '#fb7185', // Rose
  '#64748b'  // Slate Blue
];

const CustomTooltip = ({ active, payload, label, isPercent }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '10px', minWidth: '150px' }}>
        <p style={{ color: '#9ca3af', marginBottom: '8px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontWeight: 'bold' }}>
            {entry.name}: {typeof entry.value === 'number' ? (isPercent ? `${entry.value.toFixed(2)}%` : `$${entry.value.toFixed(2)}`) : (entry.value || 'N/A')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom dot for buy/sell signals
const SignalDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  if (payload.Position === 1) {
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 1024 1024" fill="#10b981">
        <path d="M512 0L928 832H96L512 0Z" />
      </svg>
    );
  }
  if (payload.Position === -1) {
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 1024 1024" fill="#ef4444">
        <path d="M512 1024L96 192h832L512 1024Z" />
      </svg>
    );
  }
  return null;
};

const StockChart = ({ data, tickers = [], isComparison, showTechnicals, showSignals, isPercent = false }) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const targetTicker = tickers[0] || '';
  const priceKey = (data[0] && targetTicker && data[0][targetTicker] !== undefined) ? targetTicker : (data[0]?.Close !== undefined ? 'Close' : targetTicker);

  const hasSMA50 = data.some(d => d.SMA_50 && d.SMA_50 !== 0);
  const hasSMA200 = data.some(d => d.SMA_200 && d.SMA_200 !== 0);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: showTechnicals ? '580px' : '380px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ width: '100%', flex: 1, minHeight: showTechnicals ? '280px' : '340px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: showTechnicals ? 10 : 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="Date" 
              stroke="#9ca3af" 
              tick={{fill: '#9ca3af'}} 
              hide={showTechnicals}
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{fill: '#9ca3af'}} 
              domain={['auto', 'auto']}
              tickFormatter={(value) => typeof value === 'number' ? (isPercent ? `${value.toFixed(1)}%` : `$${value.toFixed(2)}`) : value}
            />
            <Tooltip content={<CustomTooltip isPercent={isPercent} />} />
            <Legend 
              verticalAlign="bottom" 
              wrapperStyle={{ paddingTop: '16px', paddingBottom: '6px' }} 
            />
            
            {isComparison ? (
              tickers.map((t, index) => (
                <Line 
                  key={t}
                  type="monotone" 
                  dataKey={t} 
                  name={`${t} Close`}
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 8 }}
                />
              ))
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey={priceKey} 
                  name={`${targetTicker || 'Stock'} Price`}
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={showSignals ? <SignalDot /> : false} 
                  activeDot={{ r: 8 }}
                />
                {hasSMA50 && (
                  <Line 
                    type="monotone" 
                    dataKey="SMA_50" 
                    name="50-Day SMA"
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false} 
                  />
                )}
                {hasSMA200 && (
                  <Line 
                    type="monotone" 
                    dataKey="SMA_200" 
                    name="200-Day SMA"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false} 
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {showTechnicals && !isComparison && (
        <>
          <div style={{ width: '100%', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="Date" hide />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} domain={[0, 100]} ticks={[30, 70]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="RSI" name="RSI (14)" stroke="#f59e0b" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: '100%', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="Date" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="MACD_Hist" name="MACD Hist" fill="#8b5cf6" />
                <Line type="monotone" dataKey="MACD" name="MACD" stroke="#ec4899" dot={false} />
                <Line type="monotone" dataKey="MACD_Signal" name="Signal" stroke="#06b6d4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default StockChart;
