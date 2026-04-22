// ============================================
// DataMind — Data Cleaner
// ============================================

export class DataCleaner {
  constructor(store) {
    this.store = store;
  }

  // Detect all issues
  detectIssues() {
    const issues = [];
    const summary = this.store.getSummary();

    // Missing values per column
    Object.values(summary.columnMeta).forEach(meta => {
      if (meta.nullCount > 0) {
        issues.push({
          type: 'missing', severity: meta.nullCount / meta.totalCount > 0.1 ? 'high' : 'medium',
          icon: '🕳️', column: meta.name, count: meta.nullCount,
          title: `Missing values in "${meta.name}"`,
          description: `${meta.nullCount} missing (${((meta.nullCount / meta.totalCount) * 100).toFixed(1)}%)`,
          fixes: meta.type === 'numeric'
            ? ['Fill with mean', 'Fill with median', 'Fill with 0', 'Drop rows']
            : ['Fill with mode', 'Fill with "Unknown"', 'Drop rows']
        });
      }
    });

    // Duplicates
    const dupeCount = this._countDuplicates();
    if (dupeCount > 0) {
      issues.push({
        type: 'duplicate', severity: 'high', icon: '📋', column: 'All',
        count: dupeCount, title: 'Duplicate rows',
        description: `${dupeCount} duplicate row(s) found`,
        fixes: ['Remove duplicates']
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
        const outlierCount = values.filter(v => v < lower || v > upper).length;
        if (outlierCount > 0) {
          issues.push({
            type: 'outlier', severity: outlierCount > values.length * 0.05 ? 'high' : 'low',
            icon: '📊', column: col, count: outlierCount,
            title: `Outliers in "${col}"`,
            description: `${outlierCount} values outside [${lower.toFixed(1)}, ${upper.toFixed(1)}]`,
            fixes: ['Cap to bounds', 'Remove outlier rows']
          });
        }
      }
    });

    return issues;
  }

  // Apply fix
  applyFix(issue, fixIndex) {
    const fix = issue.fixes[fixIndex];
    let newData = JSON.parse(JSON.stringify(this.store.data));

    if (issue.type === 'missing') {
      const col = issue.column;
      const meta = this.store.columnMeta[col];

      if (fix === 'Fill with mean' && meta.mean !== undefined) {
        newData = newData.map(r => ({ ...r, [col]: r[col] === null || r[col] === undefined || r[col] === '' ? Math.round(meta.mean * 100) / 100 : r[col] }));
      } else if (fix === 'Fill with median' && meta.median !== undefined) {
        newData = newData.map(r => ({ ...r, [col]: r[col] === null || r[col] === undefined || r[col] === '' ? meta.median : r[col] }));
      } else if (fix === 'Fill with 0') {
        newData = newData.map(r => ({ ...r, [col]: r[col] === null || r[col] === undefined || r[col] === '' ? 0 : r[col] }));
      } else if (fix === 'Fill with mode') {
        const mode = meta.frequencies?.[0]?.[0] || 'Unknown';
        newData = newData.map(r => ({ ...r, [col]: r[col] === null || r[col] === undefined || r[col] === '' ? mode : r[col] }));
      } else if (fix === 'Fill with "Unknown"') {
        newData = newData.map(r => ({ ...r, [col]: r[col] === null || r[col] === undefined || r[col] === '' ? 'Unknown' : r[col] }));
      } else if (fix === 'Drop rows') {
        newData = newData.filter(r => r[col] !== null && r[col] !== undefined && r[col] !== '');
      }
    } else if (issue.type === 'duplicate' && fix === 'Remove duplicates') {
      const seen = new Set();
      newData = newData.filter(r => {
        const key = JSON.stringify(r);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else if (issue.type === 'outlier') {
      const col = issue.column;
      const meta = this.store.columnMeta[col];
      const iqr = meta.q3 - meta.q1;
      const lower = meta.q1 - 1.5 * iqr;
      const upper = meta.q3 + 1.5 * iqr;

      if (fix === 'Cap to bounds') {
        newData = newData.map(r => {
          const v = Number(r[col]);
          if (!isNaN(v)) {
            return { ...r, [col]: Math.max(lower, Math.min(upper, v)) };
          }
          return r;
        });
      } else if (fix === 'Remove outlier rows') {
        newData = newData.filter(r => {
          const v = Number(r[col]);
          return isNaN(v) || (v >= lower && v <= upper);
        });
      }
    }

    const removedCount = this.store.data.length - newData.length;
    this.store.updateData(newData);
    return { success: true, message: `Applied "${fix}". ${removedCount > 0 ? removedCount + ' rows removed.' : 'Values updated.'}`, newRowCount: newData.length };
  }

  _countDuplicates() {
    const seen = new Set();
    let count = 0;
    this.store.data.forEach(r => {
      const key = JSON.stringify(r);
      if (seen.has(key)) count++;
      else seen.add(key);
    });
    return count;
  }

  // Export
  exportCSV() {
    const csv = Papa.unparse(this.store.data);
    this._download(csv, 'cleaned_data.csv', 'text/csv');
  }

  exportJSON() {
    const json = JSON.stringify(this.store.data, null, 2);
    this._download(json, 'cleaned_data.json', 'application/json');
  }

  _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
