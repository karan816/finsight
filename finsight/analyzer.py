import pandas as pd

class StockAnalyzer:
    def calculate_sma(self, data: pd.DataFrame, window: int) -> pd.DataFrame:
        if data is None or 'Close' not in data.columns:
            print("Error: Invalid data provided for SMA calculation.")
            return data

        column_name = f'SMA_{window}'
        data[column_name] = data['Close'].rolling(window=window).mean()
        return data

    def calculate_volatility(self, data: pd.DataFrame) -> float:
        if data is None or 'Close' not in data.columns:
            return 0.0
        daily_returns = data['Close'].pct_change()
        volatility = daily_returns.std() * 100
        return volatility

    def calculate_rsi(self, data: pd.DataFrame, window: int = 14) -> pd.DataFrame:
        if data is None or 'Close' not in data.columns:
            return data
            
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).ewm(alpha=1/window, adjust=False).mean()
        loss = (-delta.where(delta < 0, 0)).ewm(alpha=1/window, adjust=False).mean()
        
        rs = gain / loss
        data['RSI'] = 100 - (100 / (1 + rs))
        return data

    def calculate_macd(self, data: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        if data is None or 'Close' not in data.columns:
            return data
            
        ema_fast = data['Close'].ewm(span=fast, adjust=False).mean()
        ema_slow = data['Close'].ewm(span=slow, adjust=False).mean()
        
        data['MACD'] = ema_fast - ema_slow
        data['MACD_Signal'] = data['MACD'].ewm(span=signal, adjust=False).mean()
        data['MACD_Hist'] = data['MACD'] - data['MACD_Signal']
        return data

    def generate_signals(self, data: pd.DataFrame, short_window: int, long_window: int) -> pd.DataFrame:
        if f'SMA_{short_window}' not in data.columns:
            self.calculate_sma(data, short_window)
        if f'SMA_{long_window}' not in data.columns:
            self.calculate_sma(data, long_window)

        data['Signal'] = 0
        data.loc[data[f'SMA_{short_window}'] > data[f'SMA_{long_window}'], 'Signal'] = 1
        data['Position'] = data['Signal'].diff()
        return data

    def get_signal_summary(self, data: pd.DataFrame) -> dict:
        if 'Position' not in data.columns:
            return {'total_buy_signals': 0, 'total_sell_signals': 0}
        return {
            'total_buy_signals': len(data[data['Position'] == 1]),
            'total_sell_signals': len(data[data['Position'] == -1])
        }

class PortfolioAnalyzer:
    def buy_and_hold(self, data: pd.DataFrame) -> float:
        if data is None or 'Close' not in data.columns:
            return 0.0
        start_price = data['Close'].iloc[0]
        end_price = data['Close'].iloc[-1]
        return ((end_price - start_price) / start_price) * 100

    def sma_strategy(self, data: pd.DataFrame, short=50, long=200) -> dict:
        if f'SMA_{short}' not in data.columns or f'SMA_{long}' not in data.columns:
            return {"strategy_return": 0.0, "buy_signals": 0, "sell_signals": 0}
        
        data = data.copy()
        data['Signal'] = 0
        data.loc[data[f'SMA_{short}'] > data[f'SMA_{long}'], 'Signal'] = 1
        data['Position'] = data['Signal'].diff()
        
        buy_signals = (data['Position'] == 1).sum()
        sell_signals = (data['Position'] == -1).sum()
        bh_return = self.buy_and_hold(data)
        
        # Calculate strategy return based on signal holding period
        strat_return = (data['Signal'].shift(1) * data['Close'].pct_change()).sum() * 100
        
        return {
            "strategy_return": round(strat_return, 2),
            "buy_signals": int(buy_signals),
            "sell_signals": int(sell_signals),
            "bh_return": round(bh_return, 2),
        }
