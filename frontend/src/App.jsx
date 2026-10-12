import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, BarChart2, TrendingUp, AlertCircle, Search, Moon, Sun } from 'lucide-react';
import StockChart from './components/StockChart';
import FundamentalsGrid from './components/FundamentalsGrid';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const POPULAR_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group' },
  { symbol: 'HD', name: 'Home Depot Inc.' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' }
];

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [backtestMap, setBacktestMap] = useState({});
  const [fundamentalsMap, setFundamentalsMap] = useState({});
  const [technicalsMap, setTechnicalsMap] = useState({});
  const [rankingData, setRankingData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicker, setSelectedTicker] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Apply theme class to body
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTickerChange = (e) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);
    
    // Autocomplete logic for comma separated values
    const parts = val.split(',');
    const currentToken = parts[parts.length - 1].trim();
    
    if (currentToken.length > 0) {
      const filtered = POPULAR_TICKERS.filter(
        t => t.symbol.startsWith(currentToken) || t.name.toUpperCase().includes(currentToken)
      ).slice(0, 5); // show max 5
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (symbol) => {
    const parts = ticker.split(',');
    parts[parts.length - 1] = ' ' + symbol; // replace last token
    
    // re-join with commas, trim leading space if it's the first token
    const newTicker = parts.join(',').trim();
    setTicker(newTicker);
    setShowSuggestions(false);
  };

  const handleAddComparison = () => {
    if (ticker && !ticker.trim().endsWith(',')) {
      setTicker(ticker.trim() + ', ');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const setPresetDateRange = (preset) => {
    let end = new Date();
    // Constrain the end date because yfinance doesn't have data for 2025/2026
    if (end.getFullYear() > 2024) {
      end = new Date('2024-08-01T00:00:00');
    }
    const start = new Date(end);
    
    switch (preset) {
      case '1D':
        start.setDate(end.getDate() - 2); // 2 days to ensure at least 1 trading day
        break;
      case '1W':
        start.setDate(end.getDate() - 7);
        break;
      case '1M':
        start.setMonth(end.getMonth() - 1);
        break;
      case '1Y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '5Y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      default:
        break;
    }
    
    // Format to YYYY-MM-DD
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    setEndDate(formatDate(end));
    setStartDate(formatDate(start));
  };

  const handleAnalyze = async () => {
    if (!ticker || !startDate || !endDate) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    setBacktestMap({});
    setFundamentalsMap({});
    setTechnicalsMap({});
    setRankingData(null);
    
    try {
      const response = await axios.get(`${API_BASE}/api/analyze`, {
        params: { ticker, start: startDate, end: endDate }
      });
      setData(response.data);
      const fetchedTickers = response.data.tickers;
      if (fetchedTickers.length > 0) {
        setSelectedTicker(fetchedTickers[0]);
      }
      
      // Fetch detailed data for all tickers to power the tabs
      const fundPromises = fetchedTickers.map(t => axios.get(`${API_BASE}/api/fundamentals`, { params: { ticker: t } }).then(r => ({ ticker: t, data: r.data })).catch(() => ({ ticker: t, data: null })));
      const btPromises = fetchedTickers.map(t => axios.get(`${API_BASE}/api/backtest`, { params: { ticker: t, start: startDate, end: endDate } }).then(r => ({ ticker: t, data: r.data })).catch(() => ({ ticker: t, data: null })));
      const techPromises = fetchedTickers.map(t => axios.get(`${API_BASE}/api/analyze`, { params: { ticker: t, start: startDate, end: endDate } }).then(r => ({ ticker: t, data: r.data })).catch(() => ({ ticker: t, data: null })));
      
      // Fetch market ranking for the first ticker
      const rankingPromise = axios.get(`${API_BASE}/api/market-ranking`, { params: { ticker: fetchedTickers[0], start: startDate, end: endDate } }).catch(() => null);

      const [fundResults, btResults, techResults, rankingRes] = await Promise.all([
        Promise.all(fundPromises),
        Promise.all(btPromises),
        Promise.all(techPromises),
        rankingPromise
      ]);

      const fMap = {};
      fundResults.forEach(r => { if(r.data) fMap[r.ticker] = r.data; });
      setFundamentalsMap(fMap);

      const bMap = {};
      btResults.forEach(r => { if(r.data) bMap[r.ticker] = r.data; });
      setBacktestMap(bMap);

      const tMap = {};
      techResults.forEach(r => { if(r.data) tMap[r.ticker] = r.data; });
      setTechnicalsMap(tMap);

      if (rankingRes && rankingRes.data) setRankingData(rankingRes.data);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch data. Ensure backend is running.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        <h1>FinSight Web</h1>
        <p>Premium Stock Analysis Dashboard</p>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute', 
            right: 0, 
            top: 0, 
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      <div className="dashboard">
        <aside className="glass-panel control-panel">
          <div className="input-group" ref={wrapperRef}>
            <label>Ticker Symbol(s)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                ref={inputRef}
                type="text" 
                placeholder="e.g. AAPL or AAPL,MSFT" 
                value={ticker}
                onChange={handleTickerChange}
                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
              />
            </div>
            
            {showSuggestions && (
              <div className="suggestions-dropdown">
                {suggestions.map((sugg) => (
                  <div 
                    key={sugg.symbol} 
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(sugg.symbol)}
                  >
                    <span style={{fontWeight: 'bold'}}>{sugg.symbol}</span>
                    <span className="suggestion-name">{sugg.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="btn" 
              style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              onClick={handleAddComparison}
            >
              + Add Comparison
            </button>
          </div>
          
          <div className="preset-buttons">
            {['1D', '1W', '1M', '1Y', '5Y'].map(preset => (
              <button 
                key={preset}
                className="preset-btn"
                onClick={() => setPresetDateRange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button 
            className="btn" 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : (
              <>
                <Search size={18} /> Analyze Stock
              </>
            )}
          </button>

          {data && (
            <div className="metrics-container">
              {!data.is_comparison && (
                <div className="metric-card">
                  <h3><Activity size={16} style={{display:'inline', marginRight:'4px'}} /> Daily Volatility (Risk)</h3>
                  <div className={`value ${data.volatility > 2.5 ? 'high' : 'low'}`}>
                    {data.volatility}%
                  </div>
                </div>
              )}
              
              <div className="metric-card">
                <h3><BarChart2 size={16} style={{display:'inline', marginRight:'4px'}} /> Data Points</h3>
                <div className="value">
                  {data.data.length}
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <TrendingUp size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {data ? (data.is_comparison ? `Comparison: ${data.tickers.join(' vs ')}` : `${data.tickers[0]} Performance Overview`) : 'Dashboard'}
            </h2>
          </div>
          
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'technicals' ? 'active' : ''}`}
              onClick={() => setActiveTab('technicals')}
            >
              Technicals
            </button>
            <button 
              className={`tab-button ${activeTab === 'backtest' ? 'active' : ''}`}
              onClick={() => setActiveTab('backtest')}
            >
              Strategy Backtest
            </button>
            <button 
              className={`tab-button ${activeTab === 'fundamentals' ? 'active' : ''}`}
              onClick={() => setActiveTab('fundamentals')}
            >
              Fundamentals
            </button>
            <button 
              className={`tab-button ${activeTab === 'ranking' ? 'active' : ''}`}
              onClick={() => setActiveTab('ranking')}
            >
              Market P&L
            </button>
          </div>

          {data && data.is_comparison && activeTab !== 'overview' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Ticker to View Details:</span>
              {data.tickers.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTicker(t)}
                  className={`preset-btn ${selectedTicker === t ? 'active-ticker' : ''}`}
                  style={{ flex: 'none', padding: '0.25rem 0.75rem', background: selectedTicker === t ? 'var(--accent-color)' : 'var(--bg-glass)', color: selectedTicker === t ? 'white' : 'var(--text-primary)' }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          
          <div className="chart-container">
            {!data ? (
              <div style={{
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#9ca3af',
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px'
              }}>
                Enter a ticker and click analyze to generate chart
              </div>
            ) : activeTab === 'overview' ? (
              <StockChart data={data.data} tickers={data.tickers} isComparison={data.is_comparison} isDarkMode={isDarkMode} />
            ) : activeTab === 'technicals' ? (
              technicalsMap[selectedTicker] ? (
                <StockChart data={technicalsMap[selectedTicker].data} tickers={[selectedTicker]} isComparison={false} showTechnicals={true} isDarkMode={isDarkMode} />
              ) : <div>Loading technicals...</div>
            ) : activeTab === 'backtest' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                {backtestMap[selectedTicker] ? (
                  <>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="metric-card" style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Strategy Return</h4>
                        <div className={`value ${backtestMap[selectedTicker].metrics.strategy_return > 0 ? 'high' : 'low'}`} style={{ color: backtestMap[selectedTicker].metrics.strategy_return > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {backtestMap[selectedTicker].metrics.strategy_return}%
                        </div>
                      </div>
                      <div className="metric-card" style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Buy & Hold Return</h4>
                        <div className={`value ${backtestMap[selectedTicker].metrics.bh_return > 0 ? 'high' : 'low'}`} style={{ color: backtestMap[selectedTicker].metrics.bh_return > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {backtestMap[selectedTicker].metrics.bh_return}%
                        </div>
                      </div>
                      <div className="metric-card" style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Total Trades</h4>
                        <div className="value" style={{ color: 'var(--text-primary)' }}>
                          {backtestMap[selectedTicker].metrics.buy_signals + backtestMap[selectedTicker].metrics.sell_signals}
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                      <StockChart data={backtestMap[selectedTicker].chart_data} tickers={[selectedTicker]} isComparison={false} showSignals={true} isDarkMode={isDarkMode} />
                    </div>
                  </>
                ) : <div>Loading backtest data...</div>}
              </div>
            ) : activeTab === 'fundamentals' ? (
              fundamentalsMap[selectedTicker] ? <FundamentalsGrid fundamentals={fundamentalsMap[selectedTicker]} /> : <div>Loading fundamentals...</div>
            ) : activeTab === 'ranking' ? (
              rankingData ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflow: 'auto' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="metric-card" style={{ flex: 1, minWidth: '150px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>{rankingData.target} Return</h4>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rankingData.target_return > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {rankingData.target_return}%
                      </div>
                    </div>
                    <div className="metric-card" style={{ flex: 1, minWidth: '150px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Rank</h4>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        #{rankingData.target_rank} of {rankingData.total_scanned}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>🏆 Top 5 Gainers</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)' }}>Ticker</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingData.top_5.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: s.ticker === rankingData.target ? 'rgba(59,130,246,0.15)' : 'transparent' }}>
                              <td style={{ padding: '0.5rem', color: 'var(--text-primary)', fontWeight: s.ticker === rankingData.target ? 'bold' : 'normal' }}>{s.ticker}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--success)', fontWeight: 'bold' }}>+{s.return}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>📉 Bottom 5 Losers</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)' }}>Ticker</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingData.bottom_5.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: s.ticker === rankingData.target ? 'rgba(59,130,246,0.15)' : 'transparent' }}>
                              <td style={{ padding: '0.5rem', color: 'var(--text-primary)', fontWeight: s.ticker === rankingData.target ? 'bold' : 'normal' }}>{s.ticker}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)', fontWeight: 'bold' }}>{s.return}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ flex: 1, minHeight: '300px' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📊 Normalized Performance (% Change)</h4>
                    <StockChart data={rankingData.chart_data} tickers={rankingData.chart_tickers} isComparison={true} isDarkMode={isDarkMode} isPercent={true} />
                  </div>
                </div>
              ) : <div style={{ color: 'var(--text-secondary)' }}>Loading market ranking...</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
