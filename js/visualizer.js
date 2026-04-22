// ============================================
// DataMind — Visualization Engine (Chart.js)
// ============================================

import { Utils } from './utils.js';

export class Visualizer {
  constructor(store) {
    this.store = store;
    this.charts = [];
    this.chartInstances = {};
  }

  getChartTheme() {
    return {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: '#8b5cf6',
      fontColor: '#94a3b8',
      gridColor: 'rgba(148, 163, 184, 0.08)',
      colors: Utils.chartColors
    };
  }

  createChart(containerId, config) {
    const canvas = document.getElementById(containerId);
    if (!canvas) return null;
    if (this.chartInstances[containerId]) {
      this.chartInstances[containerId].destroy();
    }
    const theme = this.getChartTheme();
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { labels: { color: theme.fontColor, font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true } },
        tooltip: {
          backgroundColor: 'rgba(10,10,26,0.95)', titleColor: '#f1f5f9', bodyColor: '#94a3b8',
          borderColor: 'rgba(139,92,246,0.3)', borderWidth: 1, cornerRadius: 8, padding: 12,
          titleFont: { family: 'Inter', weight: '600' }, bodyFont: { family: 'Inter' }
        }
      },
      scales: config.type !== 'pie' && config.type !== 'doughnut' && config.type !== 'radar' ? {
        x: { ticks: { color: theme.fontColor, font: { family: 'Inter', size: 11 } }, grid: { color: theme.gridColor } },
        y: { ticks: { color: theme.fontColor, font: { family: 'Inter', size: 11 } }, grid: { color: theme.gridColor } }
      } : undefined
    };

    const mergedOptions = this._deepMerge(defaultOptions, config.options || {});
    const chart = new Chart(canvas, { type: config.type, data: config.data, options: mergedOptions });
    this.chartInstances[containerId] = chart;
    return chart;
  }

  // Auto-suggest charts
  suggestCharts() {
    const summary = this.store.getSummary();
    const suggestions = [];

    // Bar chart for categorical
    summary.categoricalColumns.slice(0, 3).forEach(col => {
      const meta = summary.columnMeta[col];
      if (meta.frequencies) {
        suggestions.push({
          type: 'bar', title: `${col} Distribution`,
          description: `Frequency of each ${col} category`,
          column: col, data: this._buildBarData(col, meta.frequencies)
        });
      }
    });

    // Histogram for numeric
    summary.numericColumns.slice(0, 3).forEach(col => {
      suggestions.push({
        type: 'bar', title: `${col} Histogram`,
        description: `Value distribution of ${col}`,
        column: col, data: this._buildHistogramData(col)
      });
    });

    // Scatter for correlations
    if (summary.numericColumns.length >= 2) {
      const col1 = summary.numericColumns[0];
      const col2 = summary.numericColumns[1];
      suggestions.push({
        type: 'scatter', title: `${col1} vs ${col2}`,
        description: `Relationship between ${col1} and ${col2}`,
        columns: [col1, col2], data: this._buildScatterData(col1, col2)
      });
    }

    // Pie for top categorical
    if (summary.categoricalColumns.length > 0) {
      const col = summary.categoricalColumns[0];
      const meta = summary.columnMeta[col];
      if (meta.frequencies) {
        suggestions.push({
          type: 'doughnut', title: `${col} Breakdown`,
          description: `Proportional breakdown of ${col}`,
          column: col, data: this._buildPieData(col, meta.frequencies)
        });
      }
    }

    // Line chart if there's a numeric trend
    if (summary.numericColumns.length > 0) {
      const col = summary.numericColumns[0];
      suggestions.push({
        type: 'line', title: `${col} Trend`,
        description: `${col} values across records`,
        column: col, data: this._buildLineData(col)
      });
    }

    return suggestions;
  }

  buildChartFromQuery(chartType, column) {
    const meta = this.store.columnMeta[column];
    if (chartType === 'histogram' || (chartType === 'bar' && meta?.type === 'numeric')) {
      return { type: 'bar', data: this._buildHistogramData(column), options: { plugins: { legend: { display: false } } } };
    }
    if (chartType === 'bar' && meta?.frequencies) {
      return { type: 'bar', data: this._buildBarData(column, meta.frequencies), options: { plugins: { legend: { display: false } } } };
    }
    return null;
  }

  _buildBarData(col, frequencies) {
    const theme = this.getChartTheme();
    return {
      labels: frequencies.map(f => f[0]),
      datasets: [{
        label: col, data: frequencies.map(f => f[1]),
        backgroundColor: frequencies.map((_, i) => theme.colors[i % theme.colors.length] + '99'),
        borderColor: frequencies.map((_, i) => theme.colors[i % theme.colors.length]),
        borderWidth: 1.5, borderRadius: 6
      }]
    };
  }

  _buildHistogramData(col) {
    const values = this.store.getNumericValues(col);
    if (values.length === 0) return { labels: [], datasets: [] };
    const min = Math.min(...values), max = Math.max(...values);
    const bins = 15;
    const binWidth = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
      counts[idx]++;
    });
    const labels = counts.map((_, i) => (min + i * binWidth).toFixed(1));
    const theme = this.getChartTheme();
    return {
      labels,
      datasets: [{
        label: col, data: counts,
        backgroundColor: theme.colors[0] + '80', borderColor: theme.colors[0],
        borderWidth: 1.5, borderRadius: 4
      }]
    };
  }

  _buildScatterData(col1, col2) {
    const data = this.store.data.slice(0, 500).map(r => ({
      x: Number(r[col1]), y: Number(r[col2])
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));
    const theme = this.getChartTheme();
    return {
      datasets: [{
        label: `${col1} vs ${col2}`, data,
        backgroundColor: theme.colors[1] + '80', borderColor: theme.colors[1],
        pointRadius: 4, pointHoverRadius: 7
      }]
    };
  }

  _buildPieData(col, frequencies) {
    const theme = this.getChartTheme();
    const top = frequencies.slice(0, 8);
    return {
      labels: top.map(f => f[0]),
      datasets: [{
        data: top.map(f => f[1]),
        backgroundColor: top.map((_, i) => theme.colors[i % theme.colors.length] + 'cc'),
        borderColor: '#0a0a1a', borderWidth: 2, hoverOffset: 8
      }]
    };
  }

  _buildLineData(col) {
    const values = this.store.getNumericValues(col).slice(0, 100);
    const theme = this.getChartTheme();
    return {
      labels: values.map((_, i) => i + 1),
      datasets: [{
        label: col, data: values,
        borderColor: theme.colors[0], backgroundColor: theme.colors[0] + '20',
        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2
      }]
    };
  }

  // Custom chart builder
  buildCustomChart(type, xCol, yCol, agg = 'sum') {
    const data = this.store.data;
    const xMeta = this.store.columnMeta[xCol];
    const theme = this.getChartTheme();

    if (xMeta?.type === 'categorical' && yCol) {
      const groups = {};
      data.forEach(r => {
        const key = String(r[xCol] ?? 'N/A');
        if (!groups[key]) groups[key] = [];
        const v = Number(r[yCol]);
        if (!isNaN(v)) groups[key].push(v);
      });
      const labels = Object.keys(groups);
      const values = labels.map(k => {
        const arr = groups[k];
        if (agg === 'avg') return arr.reduce((s, v) => s + v, 0) / arr.length;
        if (agg === 'count') return arr.length;
        if (agg === 'min') return Math.min(...arr);
        if (agg === 'max') return Math.max(...arr);
        return arr.reduce((s, v) => s + v, 0);
      });
      return {
        type, data: {
          labels,
          datasets: [{
            label: `${agg}(${yCol}) by ${xCol}`, data: values,
            backgroundColor: labels.map((_, i) => theme.colors[i % theme.colors.length] + '99'),
            borderColor: labels.map((_, i) => theme.colors[i % theme.colors.length]),
            borderWidth: 1.5, borderRadius: 6, fill: type === 'line', tension: 0.4
          }]
        }
      };
    }
    return null;
  }

  destroyAll() {
    Object.values(this.chartInstances).forEach(c => c.destroy());
    this.chartInstances = {};
  }

  _deepMerge(target, source) {
    const result = { ...target };
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  }
}
