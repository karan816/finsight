# FinSight 📈

FinSight is a modern full-stack Stock Analysis & Financial Research Dashboard built with **FastAPI** (Python) and **React + Vite**. It allows you to analyze equity prices, compute moving averages (SMA 50 / 200), track volatility, inspect technical indicators (RSI & MACD), backtest trading strategies, view corporate fundamentals, and rank stocks across the S&P 500.

---

## 🌟 Key Features

- **Interactive Stock Dashboard**: Clean dark & light glassmorphic UI built with React and Tailwind-styled CSS.
- **Interactive Price & SMA Charts**: Visualizes stock price trends alongside 50-day and 200-day Simple Moving Averages.
- **Technical Analysis Suite**: Real-time Relative Strength Index (RSI 14) and Moving Average Convergence Divergence (MACD & Histogram).
- **Strategy Backtester**: Backtests SMA crossover trading strategies against a benchmark Buy-and-Hold strategy, complete with visual buy/sell markers and trade counts.
- **Corporate Fundamentals**: Live financial data including Market Cap, P/E ratios, Dividend Yield, Profit Margins, Beta, and Wall Street analyst recommendations.
- **Market P&L Rankings**: Compares and ranks your stock against top gainers and losers in the broader market.
- **Multi-Stock Comparisons**: Compare price performance across multiple tickers simultaneously (e.g. `AAPL, MSFT, GOOGL`).
- **Terminal CLI Mode**: An interactive command-line interface for rapid terminal-based stock analysis.

---

## 🏗️ Project Architecture

```
FE 520/
├── backend/
│   └── main.py              # FastAPI REST API server
├── finsight/
│   ├── analyzer.py          # Technical & Portfolio strategy analyzer
│   ├── data_loader.py       # Yahoo Finance loader & fundamental extractor
│   └── visualizer.py        # Terminal matplotlib chart visualizer
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StockChart.jsx       # Recharts price & technical charts
│   │   │   └── FundamentalsGrid.jsx # Company metrics grid
│   │   ├── App.jsx          # Main dashboard application
│   │   └── index.css        # Glassmorphism dark/light design system
│   ├── package.json
│   └── vite.config.js
├── docs/                    # Project presentation & reports
├── tests/                   # Automated pytest test suite
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages automated deployment
├── render.yaml              # 1-click free backend deployment configuration
├── Procfile                 # Process file for cloud hosting
├── requirements.txt         # Python dependencies
└── main.py                  # Terminal interactive CLI
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Set Up and Start Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server (Port 8000)
python backend/main.py
```
*API will run at [http://localhost:8000](http://localhost:8000)*

### 3. Set Up and Start Frontend
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server (Port 5173)
npm run dev
```
*Dashboard will open at [http://localhost:5173](http://localhost:5173)*

### 4. Running the CLI (Optional)
```bash
python main.py
```

### 5. Running Tests
```bash
python -m pytest
```

---

## 🌐 How to Host for Free

This project is configured so both frontend and backend can be hosted **100% free of charge**.

### Step 1: Push This Project to GitHub

1. Go to [GitHub](https://github.com/new) and click **New repository**.
2. Name your repository (e.g., `finsight`), choose **Public**, and leave initialization checkboxes unchecked.
3. Run the following commands in your project root terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

---

### Step 2: Host the Python Backend for Free (on Render)

Because GitHub Pages only hosts static files, the Python FastAPI backend can be hosted on [Render](https://render.com) for free:

1. Sign up for a free account at [render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml`, or you can configure:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://finsight-api.onrender.com`).

---

### Step 3: Host the Frontend for Free (Choose Option A or B)

#### Option A: GitHub Pages (Automatic via GitHub Actions)
A GitHub Actions workflow is included at `.github/workflows/deploy.yml`.

1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-render-backend-url.onrender.com`
4. Re-run or trigger the workflow under the **Actions** tab.
5. Your dashboard will be live at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`!

#### Option B: Vercel (1-Click Deployment)
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy**. Your frontend is live instantly!

---

## 📄 License
MIT License. Built for educational and financial quantitative analysis.
