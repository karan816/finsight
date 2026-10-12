import React from 'react';

const FundamentalsGrid = ({ fundamentals }) => {
  if (!fundamentals || Object.keys(fundamentals).length === 0) {
    return <div style={{ color: 'var(--text-secondary)' }}>No fundamental data available.</div>;
  }

  const formatNumber = (num) => {
    if (num === 'N/A' || num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return num;
  };

  const formatPercent = (num) => {
    if (num === 'N/A' || num === undefined || num === null) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  const metrics = [
    { label: 'Market Cap', value: formatNumber(fundamentals.marketCap) },
    { label: 'Trailing P/E', value: fundamentals.trailingPE },
    { label: 'Forward P/E', value: fundamentals.forwardPE },
    { label: 'Dividend Yield', value: formatPercent(fundamentals.dividendYield) },
    { label: '52-Week High', value: fundamentals.fiftyTwoWeekHigh !== 'N/A' ? `$${fundamentals.fiftyTwoWeekHigh}` : 'N/A' },
    { label: '52-Week Low', value: fundamentals.fiftyTwoWeekLow !== 'N/A' ? `$${fundamentals.fiftyTwoWeekLow}` : 'N/A' },
    { label: 'Beta (Volatility)', value: fundamentals.beta },
    { label: 'Profit Margin', value: formatPercent(fundamentals.profitMargins) },
    { label: 'Target Mean Price', value: fundamentals.targetMeanPrice !== 'N/A' ? `$${fundamentals.targetMeanPrice}` : 'N/A' },
    { label: 'Analyst Recommendation', value: (fundamentals.recommendationKey || '').toUpperCase().replace('_', ' ') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        {fundamentals.logo_url && (
          <img src={fundamentals.logo_url} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
        )}
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>{fundamentals.shortName}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {fundamentals.sector} &bull; {fundamentals.industry}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {metrics.map((m, idx) => (
          <div key={idx} className="metric-card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>
              {m.label}
            </h4>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundamentalsGrid;
