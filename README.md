# 🧠 DataMind — AI-Powered Data Analytics Dashboard

<div align="center">

![DataMind Banner](https://img.shields.io/badge/DataMind-AI%20Analytics-8b5cf6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTBBMTAgMTAgMCAwIDAgMTIgMnoiIGZpbGw9IiM4YjVjZjYiLz48L3N2Zz4=)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**A stunning, zero-dependency web application for exploring, analyzing, and cleaning datasets using AI-powered insights — right in your browser.**

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📖 Usage Guide](#-usage-guide) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Project Structure](#-project-structure)

</div>

---

## 📸 Screenshots

| Landing Page | Data Explorer |
|:---:|:---:|
| ![Upload](https://via.placeholder.com/400x250/0a0a1a/8b5cf6?text=Upload+Zone) | ![Explorer](https://via.placeholder.com/400x250/0a0a1a/06b6d4?text=Data+Table) |

| AI Insights | Visualizations |
|:---:|:---:|
| ![Insights](https://via.placeholder.com/400x250/0a0a1a/ec4899?text=AI+Insights) | ![Charts](https://via.placeholder.com/400x250/0a0a1a/10b981?text=Charts) |

> 💡 **Tip:** Replace these placeholder images with actual screenshots of your running app!

---

## 🚀 Quick Start

### Prerequisites

You only need **one** of the following installed on your machine:

| Tool | Command to Check | Install Link |
|------|-----------------|-------------|
| **Python 3.x** (Recommended) | `python --version` | [python.org](https://www.python.org/downloads/) |
| **Node.js** (Alternative) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **VS Code Live Server** (Alternative) | — | [Extension Link](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/datamind.git
cd datamind
```

### Step 2: Start a Local Server

> ⚠️ **Important:** This app uses ES6 modules, so you **must** run it through a local server. Opening `index.html` directly in the browser will not work.

**Option A — Python (Recommended):**
```bash
python -m http.server 8080
```

**Option B — Node.js:**
```bash
npx -y http-server . -p 8080 -c-1
```

**Option C — VS Code:**
1. Open the project folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` → **"Open with Live Server"**

### Step 3: Open in Browser

```
http://localhost:8080
```

That's it! 🎉 No build tools, no `npm install`, no dependencies to download.

---

## ✨ Features

### 📁 1. File Upload
- **Drag-and-drop** or click to browse files
- Supports **CSV**, **JSON**, and **Excel (.xlsx)** formats
- Built-in **sample dataset** (200+ employee records) for instant demo
- File validation and error handling

### 📋 2. Data Explorer
- Interactive data table with **sorting** (click any column header)
- **Full-text search** across all columns
- **Pagination** (50 rows per page)
- **NULL value highlighting** with red badges
- Dataset statistics bar (rows, columns, numeric/categorical counts)

### 💡 3. AI Insights Engine
Auto-generated analysis on every dataset load:
- 📊 **Dataset Overview** — Row/column counts and type breakdown
- ⚠️ **Missing Data Detection** — Identifies columns with nulls and percentages
- 🔍 **Outlier Detection** — Uses IQR method to flag statistical outliers
- 🔗 **Correlation Analysis** — Pearson correlation between numeric columns
- 📈 **High Variability Alerts** — Flags columns with unusual spread
- 🏷️ **Dominant Category Detection** — Identifies imbalanced categorical data
- 🔴 **Duplicate Row Detection** — Finds exact duplicate records

### 💬 4. AI Chat Assistant
Ask questions about your data in plain English:

| Example Query | What It Does |
|--------------|-------------|
| `"What is the average Salary?"` | Returns mean, min, max, median, std dev |
| `"Show top 10 by Revenue"` | Displays a ranked table |
| `"Are there any missing values?"` | Lists all columns with nulls |
| `"What columns are correlated?"` | Shows correlation matrix |
| `"Show distribution of Department"` | Generates an inline chart |
| `"Give me a summary"` | Full dataset overview |
| `"How many rows are there?"` | Row and column counts |

### 📈 5. Visualizations
- **Auto-suggested charts** based on your data types
- **Chart types:** Bar, Line, Pie, Doughnut, Scatter, Histogram
- **Custom Chart Builder** — Pick axes, aggregation, and chart type
- Smooth Chart.js animations with dark theme
- Responsive chart grid layout

### 🧹 6. Data Cleaning Studio
- **Missing Values** → Fill with mean, median, mode, 0, "Unknown", or drop rows
- **Duplicate Rows** → One-click removal
- **Outliers** → Cap to bounds or remove outlier rows
- **Undo/Redo** support for all cleaning operations
- **Export** cleaned data as CSV or JSON

---

## 📖 Usage Guide

### Loading Data

1. **Upload your own file:** Drag a CSV, JSON, or XLSX file onto the dropzone, or click to browse
2. **Use sample data:** Click the **"🚀 Load Sample Dataset"** button for a pre-built employee dataset

### Navigating the App

Use the **sidebar icons** on the left to switch between sections:

| Icon | Section | Description |
|------|---------|-------------|
| 📁 | Upload | Load a new dataset |
| 📋 | Explore | Browse data table |
| 💡 | Insights | View AI-generated insights |
| 💬 | Chat | Ask questions in natural language |
| 📈 | Visualize | View and build charts |
| 🧹 | Clean | Fix data issues and export |

### Building Custom Charts

1. Go to the **📈 Visualize** section
2. Scroll down to **🔧 Chart Builder**
3. Select: Chart Type → X-Axis Column → Y-Axis Column → Aggregation
4. Click **"Build Chart"**

### Cleaning Your Data

1. Go to the **🧹 Clean** section
2. Review detected issues (missing values, duplicates, outliers)
3. Click a **fix button** (e.g., "Fill with mean") to apply
4. Use **↩ Undo** if needed
5. Click **📥 Export CSV** or **📥 Export JSON** to download the cleaned dataset

---

## 🛠️ Tech Stack

| Technology | Purpose | Loaded Via |
|-----------|---------|-----------|
| **HTML5** | Page structure and semantics | — |
| **CSS3** | Dark-mode glassmorphism design system | `index.css` |
| **Vanilla JavaScript** | Application logic (ES6 Modules) | `js/*.js` |
| **[Chart.js 4.4](https://www.chartjs.org/)** | Interactive chart rendering | CDN |
| **[Papa Parse 5.4](https://www.papaparse.com/)** | CSV file parsing | CDN |
| **[SheetJS (xlsx)](https://sheetjs.com/)** | Excel file parsing | CDN |
| **[Inter Font](https://fonts.google.com/specimen/Inter)** | UI typography | Google Fonts |
| **[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)** | Data/code typography | Google Fonts |

> **No npm, no build step, no framework.** All libraries are loaded via CDN — the app works with just a static file server.

---

## 📁 Project Structure

```
datamind/
├── index.html              # Main HTML — app structure & CDN imports
├── index.css               # Complete design system (dark theme, glass UI)
├── README.md               # This file
├── LICENSE                 # MIT License
├── .gitignore              # Git ignore rules
│
└── js/
    ├── app.js              # Main controller — navigation, events, init
    ├── utils.js            # Formatters, DOM helpers, type detection
    ├── dataStore.js        # In-memory data store with event system
    ├── dataParser.js       # CSV/JSON/Excel parser + sample data generator
    ├── aiEngine.js         # Statistical analysis & NL query processor
    ├── visualizer.js       # Chart.js wrapper with auto-suggestions
    ├── dataCleaner.js      # Missing values, duplicates, outlier fixes
    └── chatInterface.js    # Chat UI with inline tables & charts
```

---

## 🌐 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 80+ | ✅ |
| Edge 80+ | ✅ |
| Firefox 78+ | ✅ |
| Safari 14+ | ✅ |
| Internet Explorer | ❌ |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 💡 Future Enhancements

- [ ] Real AI API integration (OpenAI / Google Gemini)
- [ ] SQL-like query support
- [ ] Data joins across multiple files
- [ ] Dashboard save/load
- [ ] Collaborative sharing via URL
- [ ] Dark/Light theme toggle

---

<div align="center">

**Built with ❤️ using vanilla web technologies**

⭐ Star this repo if you found it useful!

</div>
