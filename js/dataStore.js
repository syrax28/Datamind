// ============================================
// DataMind — Data Store (State Management)
// ============================================

export class DataStore {
  constructor() {
    this.data = [];
    this.columns = [];
    this.columnMeta = {};
    this.filteredData = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filters = {};
    this.page = 1;
    this.pageSize = 50;
    this.history = [];
    this.historyIndex = -1;
    this.listeners = {};
    this.fileName = '';
    this.fileSize = 0;
  }

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach(cb => cb(payload));
  }

  // Load data
  loadData(rows, fileName = '', fileSize = 0) {
    if (!rows || rows.length === 0) return;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.data = rows;
    this.columns = Object.keys(rows[0]);
    this.columnMeta = {};
    this.columns.forEach(col => {
      const values = rows.map(r => r[col]);
      this.columnMeta[col] = this._analyzeColumn(col, values);
    });
    this.filters = {};
    this.sortColumn = null;
    this.page = 1;
    this._saveHistory();
    this._applyFiltersAndSort();
    this.emit('dataLoaded', { rows: this.data, columns: this.columns, meta: this.columnMeta });
  }

  _analyzeColumn(name, values) {
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNull.length;
    const uniqueValues = new Set(nonNull.map(v => String(v)));

    let type = 'text';
    let numericValues = [];
    const sample = nonNull.slice(0, 200);
    let numCount = 0;

    for (const v of sample) {
      const n = Number(v);
      if (!isNaN(n) && String(v).trim() !== '') numCount++;
    }

    if (numCount / Math.max(sample.length, 1) >= 0.8) {
      type = 'numeric';
      numericValues = nonNull.map(Number).filter(n => !isNaN(n));
    } else if (uniqueValues.size <= Math.min(20, nonNull.length * 0.3)) {
      type = 'categorical';
    }

    const meta = { name, type, nullCount, totalCount: values.length, uniqueCount: uniqueValues.size };

    if (type === 'numeric' && numericValues.length > 0) {
      numericValues.sort((a, b) => a - b);
      meta.min = numericValues[0];
      meta.max = numericValues[numericValues.length - 1];
      meta.mean = numericValues.reduce((s, v) => s + v, 0) / numericValues.length;
      meta.median = numericValues[Math.floor(numericValues.length / 2)];
      const variance = numericValues.reduce((s, v) => s + Math.pow(v - meta.mean, 2), 0) / numericValues.length;
      meta.stdDev = Math.sqrt(variance);
      meta.q1 = numericValues[Math.floor(numericValues.length * 0.25)];
      meta.q3 = numericValues[Math.floor(numericValues.length * 0.75)];
    }

    if (type === 'categorical') {
      const freq = {};
      nonNull.forEach(v => { const s = String(v); freq[s] = (freq[s] || 0) + 1; });
      meta.frequencies = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    }

    return meta;
  }

  // Filtering
  setFilter(column, value) {
    if (value === '' || value === null) delete this.filters[column];
    else this.filters[column] = value;
    this.page = 1;
    this._applyFiltersAndSort();
    this.emit('dataFiltered', this.getPageData());
  }

  clearFilters() {
    this.filters = {};
    this.page = 1;
    this._applyFiltersAndSort();
    this.emit('dataFiltered', this.getPageData());
  }

  // Sorting
  setSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this._applyFiltersAndSort();
    this.emit('dataSorted', this.getPageData());
  }

  _applyFiltersAndSort() {
    let result = [...this.data];
    // Apply filters
    Object.entries(this.filters).forEach(([col, val]) => {
      const lower = String(val).toLowerCase();
      result = result.filter(row => String(row[col] ?? '').toLowerCase().includes(lower));
    });
    // Apply sort
    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      const meta = this.columnMeta[col];
      result.sort((a, b) => {
        let va = a[col], vb = b[col];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (meta && meta.type === 'numeric') { va = Number(va); vb = Number(vb); }
        else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
        return va < vb ? -dir : va > vb ? dir : 0;
      });
    }
    this.filteredData = result;
  }

  // Pagination
  getPageData() {
    const start = (this.page - 1) * this.pageSize;
    return {
      rows: this.filteredData.slice(start, start + this.pageSize),
      total: this.filteredData.length,
      page: this.page,
      totalPages: Math.ceil(this.filteredData.length / this.pageSize),
      columns: this.columns,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  setPage(page) {
    this.page = Math.max(1, Math.min(page, Math.ceil(this.filteredData.length / this.pageSize)));
    this.emit('pageChanged', this.getPageData());
  }

  // Get column values
  getColumnValues(col) {
    return this.data.map(r => r[col]);
  }

  getNumericValues(col) {
    return this.data.map(r => Number(r[col])).filter(n => !isNaN(n));
  }

  // History for undo/redo
  _saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.data)));
    this.historyIndex = this.history.length - 1;
    if (this.history.length > 20) { this.history.shift(); this.historyIndex--; }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.columns = Object.keys(this.data[0] || {});
      this._applyFiltersAndSort();
      this.emit('dataChanged', this.getPageData());
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.columns = Object.keys(this.data[0] || {});
      this._applyFiltersAndSort();
      this.emit('dataChanged', this.getPageData());
    }
  }

  // Mutate data (for cleaning)
  updateData(newData) {
    this.data = newData;
    this.columns = Object.keys(newData[0] || {});
    this.columns.forEach(col => {
      this.columnMeta[col] = this._analyzeColumn(col, newData.map(r => r[col]));
    });
    this._saveHistory();
    this._applyFiltersAndSort();
    this.emit('dataChanged', this.getPageData());
  }

  // Summary
  getSummary() {
    return {
      rows: this.data.length,
      columns: this.columns.length,
      fileName: this.fileName,
      fileSize: this.fileSize,
      columnMeta: this.columnMeta,
      numericColumns: this.columns.filter(c => this.columnMeta[c]?.type === 'numeric'),
      categoricalColumns: this.columns.filter(c => this.columnMeta[c]?.type === 'categorical'),
      textColumns: this.columns.filter(c => this.columnMeta[c]?.type === 'text')
    };
  }
}
