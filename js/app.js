// ============================================
// DataMind — Main Application Controller
// ============================================

import { Utils } from './utils.js';
import { DataStore } from './dataStore.js';
import { DataParser } from './dataParser.js';
import { AIEngine } from './aiEngine.js';
import { Visualizer } from './visualizer.js';
import { DataCleaner } from './dataCleaner.js';
import { ChatInterface } from './chatInterface.js';

class App {
  constructor() {
    this.store = new DataStore();
    this.parser = new DataParser(this.store);
    this.ai = new AIEngine(this.store);
    this.visualizer = new Visualizer(this.store);
    this.cleaner = new DataCleaner(this.store);
    this.chat = new ChatInterface(this.store, this.ai, this.visualizer);
    this.currentSection = 'upload';
    this.init();
  }

  init() {
    this._setupNavigation();
    this._setupUpload();
    this._setupChat();
    this._setupChartBuilder();
    this._setupCleanerActions();
    this._setupExport();

    this.store.on('dataLoaded', () => this._onDataLoaded());
    this.store.on('dataChanged', (d) => this._renderTable(d));
    this.store.on('dataFiltered', (d) => this._renderTable(d));
    this.store.on('dataSorted', (d) => this._renderTable(d));
    this.store.on('pageChanged', (d) => this._renderTable(d));

    this.chat.init('chat-messages', 'chat-input');
    this._showSection('upload');
  }

  // --- Navigation ---
  _setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        if (section !== 'upload' && this.store.data.length === 0) {
          this._showToast('Please upload a dataset first!', 'warning');
          return;
        }
        this._showSection(section);
      });
    });
  }

  _showSection(name) {
    this.currentSection = name;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const section = document.getElementById(`section-${name}`);
    const navItem = document.querySelector(`.nav-item[data-section="${name}"]`);
    if (section) { section.classList.add('active'); }
    if (navItem) { navItem.classList.add('active'); }
  }

  // --- Upload ---
  _setupUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const sampleBtn = document.getElementById('load-sample');

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault(); dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) this._handleFile(file);
      });
      dropzone.addEventListener('click', () => fileInput?.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this._handleFile(file);
      });
    }

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        const data = DataParser.generateSampleData();
        this.store.loadData(data, 'sample_employees.csv', 0);
        this._showToast('Sample dataset loaded! 🎉', 'success');
      });
    }
  }

  async _handleFile(file) {
    const loader = document.getElementById('upload-loader');
    if (loader) loader.classList.add('visible');
    try {
      await this.parser.parseFile(file);
      this._showToast(`"${file.name}" loaded successfully! 🎉`, 'success');
    } catch (err) {
      this._showToast(err.message, 'error');
    } finally {
      if (loader) loader.classList.remove('visible');
    }
  }

  // --- On Data Loaded ---
  _onDataLoaded() {
    // Update stats
    const summary = this.store.getSummary();
    this._updateStats(summary);

    // Switch to explore
    this._showSection('explore');

    // Render table
    this._renderTable(this.store.getPageData());

    // Render insights
    this._renderInsights();

    // Render chart suggestions
    this._renderChartSuggestions();

    // Render cleaning issues
    this._renderCleaningIssues();

    // Update chat suggestions
    this.chat.renderSuggestions();
    this.chat.addBotMessage(`📊 Dataset loaded! **${summary.rows} rows** × **${summary.columns} columns**. What would you like to know?`);

    // Populate chart builder dropdowns
    this._populateChartBuilder();
  }

  _updateStats(summary) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-rows', summary.rows.toLocaleString());
    el('stat-cols', summary.columns);
    el('stat-numeric', summary.numericColumns.length);
    el('stat-categorical', summary.categoricalColumns.length);
    el('stat-file', summary.fileName || 'Sample Data');
  }

  // --- Data Table ---
  _renderTable(pageData) {
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const pageInfo = document.getElementById('page-info');
    if (!thead || !tbody) return;

    // Header
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    pageData.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      if (pageData.sortColumn === col) {
        th.classList.add('sorted');
        th.textContent += pageData.sortDirection === 'asc' ? ' ▲' : ' ▼';
      }
      th.addEventListener('click', () => this.store.setSort(col));
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Body
    tbody.innerHTML = '';
    if (pageData.rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = pageData.columns.length;
      td.textContent = 'No data to display';
      td.className = 'empty-row';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      pageData.rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${idx * 20}ms`;
        pageData.columns.forEach(col => {
          const td = document.createElement('td');
          const val = row[col];
          if (val === null || val === undefined || val === '') {
            td.innerHTML = '<span class="null-badge">NULL</span>';
          } else {
            td.textContent = String(val);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    // Pagination
    if (pageInfo) pageInfo.textContent = `Page ${pageData.page} of ${pageData.totalPages} (${pageData.total} rows)`;
  }

  setupPagination() {
    document.getElementById('prev-page')?.addEventListener('click', () => this.store.setPage(this.store.page - 1));
    document.getElementById('next-page')?.addEventListener('click', () => this.store.setPage(this.store.page + 1));
  }

  // --- Search/Filter ---
  _setupTableSearch() {
    const input = document.getElementById('table-search');
    if (input) {
      input.addEventListener('input', Utils.debounce((e) => {
        const val = e.target.value;
        if (this.store.columns.length > 0) {
          this.store.columns.forEach(col => this.store.setFilter(col, ''));
          if (val) this.store.columns.forEach(col => this.store.setFilter(col, val));
        }
      }, 300));
    }
  }

  // --- Insights ---
  _renderInsights() {
    const container = document.getElementById('insights-list');
    if (!container) return;
    container.innerHTML = '';
    const insights = this.ai.generateInsights();
    insights.forEach((insight, idx) => {
      const card = Utils.createElement('div', { className: `insight-card ${insight.type}` });
      card.style.animationDelay = `${idx * 80}ms`;
      card.innerHTML = `
        <div class="insight-header">
          <span class="insight-icon">${insight.icon}</span>
          <span class="insight-title">${insight.title}</span>
          <span class="insight-badge badge-${insight.type}">${insight.type}</span>
        </div>
        <div class="insight-message">${insight.message}</div>
        <div class="insight-action">💡 ${insight.action}</div>
      `;
      container.appendChild(card);
    });
  }

  // --- Charts ---
  _renderChartSuggestions() {
    const grid = document.getElementById('charts-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const suggestions = this.visualizer.suggestCharts();
    suggestions.forEach((s, idx) => {
      const card = Utils.createElement('div', { className: 'chart-card' });
      card.style.animationDelay = `${idx * 100}ms`;
      const canvasId = `chart-auto-${idx}`;
      card.innerHTML = `
        <div class="chart-card-header">
          <h4>${s.title}</h4>
          <p>${s.description}</p>
        </div>
        <div class="chart-card-body">
          <canvas id="${canvasId}"></canvas>
        </div>
      `;
      grid.appendChild(card);
      setTimeout(() => {
        this.visualizer.createChart(canvasId, { type: s.type, data: s.data });
      }, 200 + idx * 100);
    });
  }

  _setupChartBuilder() {
    const buildBtn = document.getElementById('build-chart-btn');
    if (buildBtn) {
      buildBtn.addEventListener('click', () => {
        const type = document.getElementById('chart-type-select')?.value;
        const xCol = document.getElementById('chart-x-select')?.value;
        const yCol = document.getElementById('chart-y-select')?.value;
        const agg = document.getElementById('chart-agg-select')?.value;
        if (!xCol) { this._showToast('Please select an X-axis column', 'warning'); return; }
        const config = this.visualizer.buildCustomChart(type, xCol, yCol, agg);
        if (config) {
          this.visualizer.createChart('custom-chart-canvas', config);
          document.getElementById('custom-chart-wrap')?.classList.add('visible');
        } else {
          this._showToast('Could not build chart with selected options', 'warning');
        }
      });
    }
  }

  _populateChartBuilder() {
    const xSel = document.getElementById('chart-x-select');
    const ySel = document.getElementById('chart-y-select');
    if (!xSel || !ySel) return;
    xSel.innerHTML = '<option value="">Select column...</option>';
    ySel.innerHTML = '<option value="">Select column...</option>';
    this.store.columns.forEach(col => {
      xSel.innerHTML += `<option value="${col}">${col}</option>`;
      ySel.innerHTML += `<option value="${col}">${col}</option>`;
    });
  }

  // --- Cleaning ---
  _renderCleaningIssues() {
    const container = document.getElementById('cleaning-issues');
    if (!container) return;
    container.innerHTML = '';
    const issues = this.cleaner.detectIssues();

    if (issues.length === 0) {
      container.innerHTML = '<div class="clean-success"><span class="clean-icon">✅</span><p>Dataset looks clean! No issues detected.</p></div>';
      return;
    }

    issues.forEach((issue, idx) => {
      const card = Utils.createElement('div', { className: `cleaning-card severity-${issue.severity}` });
      card.style.animationDelay = `${idx * 80}ms`;
      const fixButtons = issue.fixes.map((fix, fi) =>
        `<button class="fix-btn" data-issue-idx="${idx}" data-fix-idx="${fi}">${fix}</button>`
      ).join('');
      card.innerHTML = `
        <div class="cleaning-header">
          <span class="cleaning-icon">${issue.icon}</span>
          <div>
            <div class="cleaning-title">${issue.title}</div>
            <div class="cleaning-desc">${issue.description}</div>
          </div>
          <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
        </div>
        <div class="cleaning-fixes">${fixButtons}</div>
      `;
      container.appendChild(card);
    });

    // Bind fix buttons
    this._currentIssues = issues;
  }

  _setupCleanerActions() {
    document.getElementById('cleaning-issues')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('fix-btn')) {
        const issueIdx = parseInt(e.target.dataset.issueIdx);
        const fixIdx = parseInt(e.target.dataset.fixIdx);
        const issue = this._currentIssues?.[issueIdx];
        if (issue) {
          const result = this.cleaner.applyFix(issue, fixIdx);
          this._showToast(result.message, 'success');
          this._renderCleaningIssues();
          this._renderInsights();
          this._updateStats(this.store.getSummary());
        }
      }
    });

    document.getElementById('undo-btn')?.addEventListener('click', () => { this.store.undo(); this._renderCleaningIssues(); });
    document.getElementById('redo-btn')?.addEventListener('click', () => { this.store.redo(); this._renderCleaningIssues(); });
  }

  _setupExport() {
    document.getElementById('export-csv')?.addEventListener('click', () => { this.cleaner.exportCSV(); this._showToast('CSV exported!', 'success'); });
    document.getElementById('export-json')?.addEventListener('click', () => { this.cleaner.exportJSON(); this._showToast('JSON exported!', 'success'); });
  }

  // --- Toast ---
  _showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = Utils.createElement('div', { className: `toast toast-${type}` });
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Chat ---
  _setupChat() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.chat.processUserInput(input.value);
          input.value = '';
        }
      });
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.chat.processUserInput(input.value);
        input.value = '';
      });
    }
  }
}

// --- Pagination setup on load ---
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.setupPagination();
  app._setupTableSearch();

  // Particles
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5, o: Math.random() * 0.4 + 0.1
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`; ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
});
