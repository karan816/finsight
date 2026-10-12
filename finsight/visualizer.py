import pandas as pd
import matplotlib.pyplot as plt

class Visualizer:
    def plot_with_indicators(self, data: pd.DataFrame, ticker: str, sma_windows: list):
        if data is None:
            print("No data to visualize.")
            return
            
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(data.index, data['Close'], label=f'{ticker} Close Price', linewidth=2)
        
        colors = ['orange', 'green', 'red']
        for i, window in enumerate(sma_windows):
            col_name = f'SMA_{window}'
            if col_name in data.columns:
                color = colors[i % len(colors)]
                ax.plot(data.index, data[col_name], label=f'{window}-Day SMA',
                        linestyle='--', color=color)

        ax.set_title(f'{ticker} Stock Analysis', fontsize=16)
        ax.set_xlabel('Date')
        ax.set_ylabel('Price (USD)')
        ax.legend()
        ax.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.show()
