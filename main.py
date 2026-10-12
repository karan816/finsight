from finsight.data_loader import DataLoader
from finsight.analyzer import StockAnalyzer, PortfolioAnalyzer
from finsight.visualizer import Visualizer

def main_menu():
    print("\n==============================================")
    print("Welcome to FinSight - Stock Analysis Tool")
    print("==============================================")

    while True:
        print("\nMenu:")
        print("1. Analyze a Stock")
        print("2. Compare Stock Volatility (AAPL vs MSFT)")
        print("3. Multi-SMA Analysis (TSLA)")
        print("4. Interactive Terminal")
        print("5. Exit")
        choice = input("\nEnter choice (1-5): ")

        if choice == '5':
            print("Exiting application. Goodbye!")
            break

        if choice == '1':
            ticker = input("Enter Ticker Symbol (e.g., AAPL): ").upper()
            start = input("Enter Start Date (YYYY-MM-DD): ")
            end = input("Enter End Date (YYYY-MM-DD): ")
            loader = DataLoader()
            df = loader.fetch_stock(ticker, start, end)

            if df is not None:
                analyzer = StockAnalyzer()
                df = analyzer.calculate_sma(df, 50)
                df = analyzer.calculate_sma(df, 200)
                vol = analyzer.calculate_volatility(df)
                print(f"\nVolatility (Risk): {vol:.2f}%")
                
                viz = Visualizer()
                print("Generating chart...")
                viz.plot_with_indicators(df, ticker, [50, 200])

        elif choice == '2':
            print("\n--- Volatility Comparison ---")
            tickers = ['AAPL', 'MSFT']
            results = {}
            for ticker in tickers:
                loader = DataLoader()
                data = loader.fetch_stock(ticker, '2024-01-01', '2024-12-01')
                if data is not None:
                    analyzer = StockAnalyzer()
                    volatility = analyzer.calculate_volatility(data)
                    results[ticker] = round(volatility, 2)

            print("\nStock Volatility Comparison (Lower = Less Risky):")
            for ticker, vol in results.items():
                print(f"{ticker}: {vol}% daily volatility")

        elif choice == '3':
            print("\n--- Multi-SMA Analysis ---")
            loader = DataLoader()
            data = loader.fetch_stock('TSLA', '2023-01-01', '2024-12-01')

            if data is not None:
                analyzer = StockAnalyzer()
                data = analyzer.calculate_sma(data, 50)
                data = analyzer.calculate_sma(data, 200)

                viz = Visualizer()
                print("Plotting TSLA with 50-day and 200-day Moving Averages...")
                viz.plot_with_indicators(data, 'TSLA', [50, 200])

        elif choice == '4':
            print("\n--- FinSight Interactive Terminal ---")
            while True:
                ticker = input("\nEnter stock symbol (or 'quit' to exit): ").upper()
                if ticker == 'QUIT':
                    break

                start = input("Enter start date (YYYY-MM-DD): ")
                end = input("Enter end date (YYYY-MM-DD): ")

                loader = DataLoader()
                data = loader.fetch_stock(ticker, start, end)

                if data is not None:
                    analyzer = StockAnalyzer()
                    data = analyzer.calculate_sma(data, 50)
                    vol = analyzer.calculate_volatility(data)
                    print(f"\nAnalysis for {ticker}:")
                    print(f"Volatility: {vol:.2f}%")
                    viz = Visualizer()
                    viz.plot_with_indicators(data, ticker, [50])

        else:
            print("Invalid choice, please try again.")

def main():
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\nProgram interrupted. Exiting.")

if __name__ == "__main__":
    main()
