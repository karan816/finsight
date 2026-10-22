import yfinance as yf
import pandas as pd
from requests.exceptions import RequestException, ConnectionError

class DataLoader:
    _stock_cache = {}
    _fundamentals_cache = {}

    def fetch_stock(self, ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
        clean_ticker = ticker.strip().upper().replace('.', '-')
        cache_key = (clean_ticker, start_date, end_date)
        if cache_key in DataLoader._stock_cache:
            return DataLoader._stock_cache[cache_key].copy()

        try:
            print(f"Attempting to fetch data for {clean_ticker}...")
            data = yf.download(clean_ticker, start=start_date, end=end_date, progress=False)
            if data is None or data.empty:
                print(f"Error: No data found for symbol '{clean_ticker}'. It may be delisted or invalid.")
                return None
            
            # yfinance returns MultiIndex columns sometimes
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)

            print("Data Retrieved Successfully!")
            DataLoader._stock_cache[cache_key] = data
            return data.copy()

        except ValueError:
            print("Error: Dates must be in YYYY-MM-DD format.")
            return None
        except (ConnectionError, RequestException):
            print("Error: Internet connection failed.")
            return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None

    def fetch_fundamentals(self, ticker: str) -> dict:
        clean_ticker = ticker.strip().upper().replace('.', '-')
        if clean_ticker in DataLoader._fundamentals_cache:
            return DataLoader._fundamentals_cache[clean_ticker]

        try:
            stock = yf.Ticker(clean_ticker)
            info = stock.info
            
            # Extract key fundamental metrics safely
            res = {
                "shortName": info.get("shortName", ticker),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "marketCap": info.get("marketCap", "N/A"),
                "trailingPE": info.get("trailingPE", "N/A"),
                "forwardPE": info.get("forwardPE", "N/A"),
                "dividendYield": info.get("dividendYield", "N/A"),
                "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh", "N/A"),
                "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow", "N/A"),
                "beta": info.get("beta", "N/A"),
                "profitMargins": info.get("profitMargins", "N/A"),
                "recommendationKey": info.get("recommendationKey", "N/A"),
                "targetMeanPrice": info.get("targetMeanPrice", "N/A"),
                "logo_url": info.get("logo_url", "")
            }
            DataLoader._fundamentals_cache[clean_ticker] = res
            return res
        except Exception as e:
            print(f"Error fetching fundamentals for {ticker}: {e}")
            return {}
