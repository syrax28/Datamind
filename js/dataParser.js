// ============================================
// DataMind — Data Parser (CSV, JSON, Excel)
// ============================================

export class DataParser {
  constructor(store) {
    this.store = store;
  }

  async parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let rows;
    if (ext === 'csv' || ext === 'tsv') {
      rows = await this._parseCSV(file);
    } else if (ext === 'json') {
      rows = await this._parseJSON(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      rows = await this._parseExcel(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV, JSON, or Excel files.');
    }
    if (!rows || rows.length === 0) throw new Error('No data found in file.');
    this.store.loadData(rows, file.name, file.size);
    return rows;
  }

  _parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => resolve(results.data),
        error: err => reject(new Error('CSV parse error: ' + err.message))
      });
    });
  }

  async _parseJSON(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      const firstArr = keys.find(k => Array.isArray(parsed[k]));
      if (firstArr) return parsed[firstArr];
      return [parsed];
    }
    throw new Error('JSON must contain an array of objects.');
  }

  async _parseExcel(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  }

  // Generate sample data for demo
  static generateSampleData() {
    const departments = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];
    const cities = ['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin', 'Sydney'];
    const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'];
    const rows = [];
    for (let i = 0; i < 200; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const baseSalary = { Junior: 45000, Mid: 65000, Senior: 90000, Lead: 110000, Manager: 125000, Director: 155000 };
      const salary = baseSalary[level] + Math.floor(Math.random() * 20000) - 10000;
      const year = 2020 + Math.floor(Math.random() * 6);
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      rows.push({
        ID: i + 1,
        Name: `Employee_${i + 1}`,
        Department: dept,
        Level: level,
        City: cities[Math.floor(Math.random() * cities.length)],
        Salary: salary,
        Experience: Math.floor(Math.random() * 20) + 1,
        Performance: +(Math.random() * 4 + 1).toFixed(1),
        Satisfaction: +(Math.random() * 5).toFixed(1),
        JoinDate: `${year}-${month}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        Revenue: Math.floor(Math.random() * 500000) + 10000,
        Projects: Math.floor(Math.random() * 15) + 1,
        RemoteWork: Math.random() > 0.4 ? 'Yes' : 'No'
      });
    }
    // Add some nulls for cleaning demo
    for (let i = 0; i < 15; i++) {
      const idx = Math.floor(Math.random() * rows.length);
      const cols = ['Salary', 'Performance', 'Satisfaction'];
      rows[idx][cols[Math.floor(Math.random() * cols.length)]] = null;
    }
    // Add duplicates
    for (let i = 0; i < 5; i++) {
      rows.push({ ...rows[i] });
    }
    return rows;
  }
}
