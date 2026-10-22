import sys
from pathlib import Path

# Add project root to sys.path so finsight can always be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from finsight.data_loader import DataLoader
from finsight.analyzer import StockAnalyzer, PortfolioAnalyzer

app = FastAPI(title="FinSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/analyze")
def analyze_stock(ticker: str, start: str, end: str):
    tickers = [t.strip().upper().replace('.', '-') for t in ticker.split(',') if t.strip()]
    if not tickers:
        raise HTTPException(status_code=400, detail="Please provide at least one valid ticker symbol.")
        
    loader = DataLoader()
    analyzer = StockAnalyzer()
    
    if len(tickers) == 1:
        # Single ticker mode: Return price + SMAs + Volatility
        df = loader.fetch_stock(tickers[0], start, end)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail=f"Data not found for {tickers[0]}")
            
        df = analyzer.calculate_sma(df, 50)
        df = analyzer.calculate_sma(df, 200)
        df = analyzer.calculate_rsi(df)
        df = analyzer.calculate_macd(df)
        volatility = analyzer.calculate_volatility(df)
        
        df_reset = df.reset_index()
        if 'Date' not in df_reset.columns:
            df_reset = df_reset.rename(columns={df_reset.columns[0]: 'Date'})
            
        try:
            df_reset['Date'] = df_reset['Date'].dt.strftime('%Y-%m-%d')
        except Exception:
            pass
            
        df_reset = df_reset.fillna(0)
        
        # Rename 'Close' to the ticker name for dynamic frontend rendering
        df_reset = df_reset.rename(columns={'Close': tickers[0]})
        
        columns_to_keep = ['Date', tickers[0]]
        for col in ['SMA_50', 'SMA_200', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist']:
            if col in df_reset.columns: 
                columns_to_keep.append(col)
        
        df_final = df_reset[[c for c in columns_to_keep if c in df_reset.columns]]
        
        return {
            "tickers": tickers,
            "volatility": round(volatility, 2),
            "is_comparison": False,
            "data": df_final.to_dict(orient="records")
        }
    else:
        # Comparison mode: Return only Close prices for all tickers
        import pandas as pd
        merged_df = None
        
        for t in tickers:
            df = loader.fetch_stock(t, start, end)
            if df is not None and not df.empty:
                df = df[['Close']].rename(columns={'Close': t})
                if merged_df is None:
                    merged_df = df
                else:
                    merged_df = merged_df.join(df, how='outer')
                    
        if merged_df is None:
            raise HTTPException(status_code=404, detail="No data found for any ticker.")
            
        df_reset = merged_df.reset_index()
        if 'Date' not in df_reset.columns:
            df_reset = df_reset.rename(columns={df_reset.columns[0]: 'Date'})
            
        try:
            df_reset['Date'] = df_reset['Date'].dt.strftime('%Y-%m-%d')
        except Exception:
            pass
            
        df_reset = df_reset.fillna(0) # or forward fill if preferred, but 0 is safe for recharts
        
        return {
            "tickers": tickers,
            "is_comparison": True,
            "data": df_reset.to_dict(orient="records")
        }

@app.get("/api/compare")
def compare_stocks():
    return {"message": "Comparison endpoint not fully implemented."}

@app.get("/api/fundamentals")
def get_fundamentals(ticker: str):
    loader = DataLoader()
    data = loader.fetch_fundamentals(ticker.strip().upper())
    if not data:
        raise HTTPException(status_code=404, detail="Fundamentals not found.")
    return data

@app.get("/api/backtest")
def run_backtest(ticker: str, start: str, end: str):
    loader = DataLoader()
    analyzer = StockAnalyzer()
    portfolio = PortfolioAnalyzer()
    
    df = loader.fetch_stock(ticker.strip().upper(), start, end)
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Stock data not found.")
        
    df = analyzer.calculate_sma(df, 50)
    df = analyzer.calculate_sma(df, 200)
    
    results = portfolio.sma_strategy(df, 50, 200)
    df = analyzer.generate_signals(df, 50, 200)
    
    df_reset = df.reset_index()
    if 'Date' not in df_reset.columns:
        df_reset = df_reset.rename(columns={df_reset.columns[0]: 'Date'})
    try:
        df_reset['Date'] = df_reset['Date'].dt.strftime('%Y-%m-%d')
    except:
        pass
        
    df_reset = df_reset.fillna(0)
    chart_data = df_reset[['Date', 'Close', 'SMA_50', 'SMA_200', 'Position']].to_dict(orient="records")
    
    return {
        "ticker": ticker.upper(),
        "metrics": results,
        "chart_data": chart_data
    }

MARKET_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
    'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'DIS', 'BAC',
    'XOM', 'NFLX', 'KO', 'PEP', 'CSCO', 'INTC', 'AMD', 'CRM', 'ORCL',
    'COST', 'ABBV', 'MRK'
]

@app.get("/api/market-ranking")
def market_ranking(ticker: str, start: str, end: str):
    import pandas as pd
    import yfinance as yf
    loader = DataLoader()
    portfolio = PortfolioAnalyzer()
    
    target = ticker.strip().upper().replace('.', '-')
    scan_list = list(set(MARKET_TICKERS + [target]))
    
    # 🚀 10x OPTIMIZATION: Fetch all tickers in a single batch download instead of 30 sequential loops
    try:
        batch_df = yf.download(scan_list, start=start, end=end, progress=False)
    except Exception as e:
        print(f"Batch download failed: {e}")
        batch_df = None
        
    if batch_df is None or batch_df.empty or 'Close' not in batch_df:
        raise HTTPException(status_code=404, detail="Could not fetch market data.")
        
    close_data = batch_df['Close']
    returns_list = []
    valid_tickers = []
    
    for t in scan_list:
        if t in close_data:
            series = close_data[t].dropna()
            if len(series) >= 2:
                first_price = series.iloc[0]
                last_price = series.iloc[-1]
                if first_price > 0:
                    ret = ((last_price - first_price) / first_price) * 100
                    returns_list.append({"ticker": t, "return": round(ret, 2)})
                    valid_tickers.append(t)
    
    if not returns_list:
        raise HTTPException(status_code=404, detail="Could not calculate market returns.")
    
    # Sort by return
    sorted_stocks = sorted(returns_list, key=lambda x: x["return"])
    
    bottom_5 = sorted_stocks[:5]
    top_5 = sorted_stocks[-5:][::-1]  # Highest first
    
    # Target rank
    target_entry = next((s for s in returns_list if s["ticker"] == target), None)
    target_rank = None
    if target_entry:
        target_rank = next((i + 1 for i, s in enumerate(sorted_stocks) if s["ticker"] == target), None)
    
    # Build chart data directly from already-downloaded batch data (Zero extra network calls!)
    chart_tickers = list(set([s["ticker"] for s in top_5 + bottom_5] + [target]))
    chart_df = pd.DataFrame(index=close_data.index)
    
    for t in chart_tickers:
        if t in close_data:
            series = close_data[t].dropna()
            if len(series) > 0 and series.iloc[0] > 0:
                first_price = series.iloc[0]
                chart_df[t] = ((close_data[t] - first_price) / first_price) * 100
                
    chart_df = chart_df.dropna(how='all').fillna(0)
    df_reset = chart_df.reset_index()
    if 'Date' not in df_reset.columns:
        df_reset = df_reset.rename(columns={df_reset.columns[0]: 'Date'})
    try:
        df_reset['Date'] = df_reset['Date'].dt.strftime('%Y-%m-%d')
    except Exception:
        pass
        
    chart_data = df_reset.to_dict(orient="records")
    
    return {
        "target": target,
        "target_return": target_entry["return"] if target_entry else None,
        "target_rank": target_rank,
        "total_scanned": len(returns_list),
        "top_5": top_5,
        "bottom_5": bottom_5,
        "chart_tickers": [t for t in chart_tickers if t in chart_df.columns],
        "chart_data": chart_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


