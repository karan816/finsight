import pandas as pd
from finsight.analyzer import StockAnalyzer, PortfolioAnalyzer

def test_sma():
    df = pd.DataFrame({"Close": [1, 2, 3, 4, 5]})
    analyzer = StockAnalyzer()
    df = analyzer.calculate_sma(df, 3)
    assert df['SMA_3'].iloc[-1] == 4.0

def test_buy_and_hold():
    df = pd.DataFrame({"Close": [100, 110]})
    pa = PortfolioAnalyzer()
    assert pa.buy_and_hold(df) == 10.0
