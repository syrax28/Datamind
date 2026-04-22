// ============================================
// DataMind — AI Analysis Engine
// ============================================

export class AIEngine {
  constructor(store) {
    this.store = store;
  }

  // Generate all insights
  generateInsights() {
    const summary = this.store.getSummary();
    const insights = [];

    // Dataset overview
    insights.push({
      type: 'info', icon: '📊', title: 'Dataset Overview',
      message: `${summary.rows} rows × ${summary.columns} columns. ${summary.numericColumns.length} numeric, ${summary.categoricalColumns.length} categorical columns detected.`,
      action: 'Explore the data table to review all records.'
    });

    // Missing data
    const missingCols = [];
    Object.values(summary.columnMeta).forEach(meta => {
      if (meta.nullCount > 0) {
        const pct = ((meta.nullCount / meta.totalCount) * 100).toFixed(1);
        missingCols.push({ name: meta.name, count: meta.nullCount, pct });
      }
    });
    if (missingCols.length > 0) {
      const total = missingCols.reduce((s, c) => s + c.count, 0);
      insights.push({
        type: 'warning', icon: '⚠️', title: 'Missing Data Detected',
        message: `${total} missing values found across ${missingCols.length} column(s): ${missingCols.map(c => `${c.name} (${c.pct}%)`).join(', ')}.`,
        action: 'Go to Data Cleaning to fill or remove missing values.'
      });
    }

    // Outliers
    summary.numericColumns.forEach(col => {
      const meta = summary.columnMeta[col];
      if (meta.q1 !== undefined) {
        const iqr = meta.q3 - meta.q1;
        const lower = meta.q1 - 1.5 * iqr;
        const upper = meta.q3 + 1.5 * iqr;
        const values = this.store.getNumericValues(col);
        const outliers = values.filter(v => v < lower || v > upper);
        if (outliers.length > 0) {
          insights.push({
            type: 'warning', icon: '🔍', title: `Outliers in "${col}"`,
            message: `${outliers.length} outlier(s) detected (IQR method). Range: [${lower.toFixed(1)}, ${upper.toFixed(1)}]. Found values outside this range.`,
            action: 'Review outliers in the Data Cleaning section.'
          });
        }
      }
    });

    // Correlations
    const numCols = summary.numericColumns;
    const correlations = [];
    for (let i = 0; i < numCols.length; i++) {
      for (let j = i + 1; j < numCols.length; j++) {
        const corr = this._pearsonCorrelation(
          this.store.getNumericValues(numCols[i]),
          this.store.getNumericValues(numCols[j])
        );
        if (Math.abs(corr) > 0.5) {
          correlations.push({ col1: numCols[i], col2: numCols[j], value: corr });
        }
      }
    }
    if (correlations.length > 0) {
      correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      const top = correlations.slice(0, 5);
      insights.push({
        type: 'info', icon: '🔗', title: 'Column Correlations Found',
        message: top.map(c => `${c.col1} ↔ ${c.col2}: ${(c.value > 0 ? '+' : '') + c.value.toFixed(2)}`).join(' | '),
        action: 'Visualize these correlations with a scatter plot.'
      });
    }

    // Distribution insights
    summary.numericColumns.forEach(col => {
      const meta = summary.columnMeta[col];
      if (meta.stdDev !== undefined && meta.mean !== undefined) {
        const cv = meta.stdDev / Math.abs(meta.mean || 1);
        if (cv > 1) {
          insights.push({
            type: 'info', icon: '📈', title: `High Variability in "${col}"`,
            message: `Coefficient of variation: ${(cv * 100).toFixed(1)}%. Mean: ${meta.mean.toFixed(2)}, Std Dev: ${meta.stdDev.toFixed(2)}.`,
            action: 'Check for data quality issues or natural groupings.'
          });
        }
      }
    });

    // Categorical insights
    summary.categoricalColumns.forEach(col => {
      const meta = summary.columnMeta[col];
      if (meta.frequencies && meta.frequencies.length > 0) {
        const top = meta.frequencies[0];
        const pct = ((top[1] / meta.totalCount) * 100).toFixed(1);
        if (pct > 50) {
          insights.push({
            type: 'info', icon: '🏷️', title: `Dominant Category in "${col}"`,
            message: `"${top[0]}" appears in ${pct}% of rows (${top[1]} out of ${meta.totalCount}).`,
            action: 'Consider if this imbalance affects your analysis.'
          });
        }
      }
    });

    // Duplicate check
    const dupes = this._findDuplicates();
    if (dupes > 0) {
      insights.push({
        type: 'critical', icon: '🔴', title: 'Duplicate Rows Found',
        message: `${dupes} duplicate row(s) detected in the dataset.`,
        action: 'Remove duplicates in the Data Cleaning section.'
      });
    }

    return insights;
  }

  _pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 5) return 0;
    const xSlice = x.slice(0, n), ySlice = y.slice(0, n);
    const xMean = xSlice.reduce((s, v) => s + v, 0) / n;
    const yMean = ySlice.reduce((s, v) => s + v, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xSlice[i] - xMean, dy = ySlice[i] - yMean;
      num += dx * dy; denX += dx * dx; denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  }

  _findDuplicates() {
    const seen = new Set();
    let count = 0;
    this.store.data.forEach(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) count++;
      else seen.add(key);
    });
    return count;
  }

  // Natural Language Query
  processQuery(query) {
    const q = query.toLowerCase().trim();
    const summary = this.store.getSummary();
    const cols = this.store.columns;

    // Find mentioned column
    const mentionedCol = cols.find(c => q.includes(c.toLowerCase()));

    // Average / Mean
    if (q.match(/\b(average|mean|avg)\b/)) {
      const col = mentionedCol || summary.numericColumns[0];
      if (!col || !summary.columnMeta[col] || summary.columnMeta[col].type !== 'numeric') {
        return { text: 'Please specify a numeric column for average calculation.', type: 'text' };
      }
      const meta = summary.columnMeta[col];
      return { text: `The average of **${col}** is **${meta.mean.toFixed(2)}**\n\n• Min: ${meta.min}\n• Max: ${meta.max}\n• Median: ${meta.median}\n• Std Dev: ${meta.stdDev.toFixed(2)}`, type: 'text' };
    }

    // Sum / Total
    if (q.match(/\b(sum|total)\b/)) {
      const col = mentionedCol || summary.numericColumns[0];
      if (!col) return { text: 'Please specify a numeric column.', type: 'text' };
      const values = this.store.getNumericValues(col);
      const total = values.reduce((s, v) => s + v, 0);
      return { text: `The total sum of **${col}** is **${total.toLocaleString()}** across ${values.length} records.`, type: 'text' };
    }

    // Top / Highest / Max
    if (q.match(/\b(top|highest|maximum|max|largest|best)\b/)) {
      const numMatch = q.match(/top\s+(\d+)/);
      const n = numMatch ? parseInt(numMatch[1]) : 10;
      const col = mentionedCol || summary.numericColumns[0];
      if (!col) return { text: 'Please specify a column.', type: 'text' };
      const sorted = [...this.store.data].sort((a, b) => (Number(b[col]) || 0) - (Number(a[col]) || 0));
      return { text: `Top ${n} rows by **${col}**:`, type: 'table', data: sorted.slice(0, n), columns: cols };
    }

    // Bottom / Lowest / Min
    if (q.match(/\b(bottom|lowest|minimum|min|smallest|worst)\b/)) {
      const numMatch = q.match(/bottom\s+(\d+)/);
      const n = numMatch ? parseInt(numMatch[1]) : 10;
      const col = mentionedCol || summary.numericColumns[0];
      if (!col) return { text: 'Please specify a column.', type: 'text' };
      const sorted = [...this.store.data].sort((a, b) => (Number(a[col]) || 0) - (Number(b[col]) || 0));
      return { text: `Bottom ${n} rows by **${col}**:`, type: 'table', data: sorted.slice(0, n), columns: cols };
    }

    // Missing / Null
    if (q.match(/\b(missing|null|empty|blank)\b/)) {
      const missing = [];
      Object.values(summary.columnMeta).forEach(meta => {
        if (meta.nullCount > 0) missing.push(`• **${meta.name}**: ${meta.nullCount} missing (${((meta.nullCount / meta.totalCount) * 100).toFixed(1)}%)`);
      });
      return { text: missing.length > 0 ? `Missing values found:\n\n${missing.join('\n')}` : 'No missing values found in the dataset! ✅', type: 'text' };
    }

    // Correlation
    if (q.match(/\b(correlat|relationship|related)\b/)) {
      const numCols = summary.numericColumns;
      const results = [];
      for (let i = 0; i < numCols.length && i < 8; i++) {
        for (let j = i + 1; j < numCols.length && j < 8; j++) {
          const corr = this._pearsonCorrelation(this.store.getNumericValues(numCols[i]), this.store.getNumericValues(numCols[j]));
          if (Math.abs(corr) > 0.3) results.push({ Columns: `${numCols[i]} ↔ ${numCols[j]}`, Correlation: corr.toFixed(3), Strength: Math.abs(corr) > 0.7 ? 'Strong' : 'Moderate' });
        }
      }
      return results.length > 0
        ? { text: 'Correlations between numeric columns:', type: 'table', data: results, columns: ['Columns', 'Correlation', 'Strength'] }
        : { text: 'No significant correlations found.', type: 'text' };
    }

    // Distribution / Show
    if (q.match(/\b(distribution|histogram|spread|show)\b/) && mentionedCol) {
      const meta = summary.columnMeta[mentionedCol];
      if (meta.type === 'numeric') {
        return { text: `Distribution of **${mentionedCol}**`, type: 'chart', chartType: 'histogram', column: mentionedCol };
      }
      if (meta.type === 'categorical' && meta.frequencies) {
        return { text: `Distribution of **${mentionedCol}**`, type: 'chart', chartType: 'bar', column: mentionedCol, data: meta.frequencies };
      }
    }

    // Count / How many
    if (q.match(/\b(count|how many|number of|rows)\b/)) {
      if (mentionedCol) {
        const meta = summary.columnMeta[mentionedCol];
        return { text: `Column **${mentionedCol}**:\n• Total: ${meta.totalCount} rows\n• Non-null: ${meta.totalCount - meta.nullCount}\n• Unique: ${meta.uniqueCount} values`, type: 'text' };
      }
      return { text: `The dataset has **${summary.rows} rows** and **${summary.columns} columns**.`, type: 'text' };
    }

    // Columns / Schema
    if (q.match(/\b(columns?|fields?|schema|structure)\b/)) {
      const data = cols.map(c => ({ Column: c, Type: summary.columnMeta[c]?.type || 'unknown', 'Non-null': summary.columnMeta[c] ? (summary.columnMeta[c].totalCount - summary.columnMeta[c].nullCount) : '—', Unique: summary.columnMeta[c]?.uniqueCount || '—' }));
      return { text: 'Dataset schema:', type: 'table', data, columns: ['Column', 'Type', 'Non-null', 'Unique'] };
    }

    // Summary
    if (q.match(/\b(summary|describe|overview|info)\b/)) {
      let text = `📊 **Dataset Summary**\n\n`;
      text += `• File: ${summary.fileName || 'Sample Data'}\n`;
      text += `• Rows: ${summary.rows.toLocaleString()}\n`;
      text += `• Columns: ${summary.columns}\n`;
      text += `• Numeric: ${summary.numericColumns.join(', ') || 'None'}\n`;
      text += `• Categorical: ${summary.categoricalColumns.join(', ') || 'None'}\n`;
      return { text, type: 'text' };
    }

    // Default
    return {
      text: `I analyzed your query but couldn't find a specific match. Try asking about:\n\n• **"average Salary"** — Statistics for a column\n• **"top 10 by Revenue"** — Ranked data\n• **"missing values"** — Data quality\n• **"correlations"** — Relationships between columns\n• **"show distribution of Department"** — Visualize a column\n• **"summary"** — Dataset overview`,
      type: 'text'
    };
  }

  getSuggestedQuestions() {
    const summary = this.store.getSummary();
    const questions = ['Give me a summary of this dataset'];
    if (summary.numericColumns.length > 0) {
      questions.push(`What is the average ${summary.numericColumns[0]}?`);
      questions.push(`Show top 10 by ${summary.numericColumns[0]}`);
    }
    questions.push('Are there any missing values?');
    if (summary.numericColumns.length >= 2) questions.push('What columns are correlated?');
    if (summary.categoricalColumns.length > 0) questions.push(`Show distribution of ${summary.categoricalColumns[0]}`);
    questions.push('How many rows are there?');
    return questions;
  }
}
