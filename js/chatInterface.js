// ============================================
// DataMind — Chat Interface
// ============================================

import { Utils } from './utils.js';

export class ChatInterface {
  constructor(store, aiEngine, visualizer) {
    this.store = store;
    this.ai = aiEngine;
    this.visualizer = visualizer;
    this.messages = [];
    this.chatContainer = null;
    this.inputEl = null;
    this.chartCounter = 0;
  }

  init(containerId, inputId) {
    this.chatContainer = document.getElementById(containerId);
    this.inputEl = document.getElementById(inputId);
    this.addBotMessage("👋 Hi! I'm your AI data assistant. Upload a dataset and ask me anything about it!\n\nTry questions like:\n• *\"What is the average Salary?\"*\n• *\"Show top 10 by Revenue\"*\n• *\"Are there any missing values?\"*");
  }

  addBotMessage(text, extra = null) {
    const msg = { role: 'bot', text, extra, time: new Date() };
    this.messages.push(msg);
    this._renderMessage(msg);
  }

  addUserMessage(text) {
    const msg = { role: 'user', text, time: new Date() };
    this.messages.push(msg);
    this._renderMessage(msg);
  }

  processUserInput(query) {
    if (!query.trim()) return;
    this.addUserMessage(query);

    if (!this.store.data || this.store.data.length === 0) {
      this.addBotMessage("⚠️ No dataset loaded yet. Please upload a file or load the sample data first!");
      return;
    }

    // Simulate thinking delay
    const thinkingEl = this._addThinking();
    setTimeout(() => {
      thinkingEl.remove();
      const result = this.ai.processQuery(query);
      if (result.type === 'table') {
        this.addBotMessage(result.text, { type: 'table', data: result.data, columns: result.columns });
      } else if (result.type === 'chart') {
        this.addBotMessage(result.text, { type: 'chart', chartType: result.chartType, column: result.column, chartData: result.data });
      } else {
        this.addBotMessage(result.text);
      }
    }, 500 + Math.random() * 500);
  }

  renderSuggestions() {
    const container = document.getElementById('chat-suggestions');
    if (!container) return;
    const questions = this.ai.getSuggestedQuestions();
    container.innerHTML = '';
    questions.forEach(q => {
      const btn = Utils.createElement('button', {
        className: 'suggestion-pill',
        textContent: q,
        onClick: () => {
          this.inputEl.value = '';
          this.processUserInput(q);
        }
      });
      container.appendChild(btn);
    });
  }

  _renderMessage(msg) {
    if (!this.chatContainer) return;
    const wrapper = Utils.createElement('div', { className: `chat-message ${msg.role}` });
    const avatar = Utils.createElement('div', { className: 'chat-avatar', innerHTML: msg.role === 'bot' ? '🤖' : '👤' });
    const bubble = Utils.createElement('div', { className: 'chat-bubble' });

    // Parse markdown-like formatting
    let html = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '&bull; ');
    bubble.innerHTML = `<div class="chat-text">${html}</div>`;

    // Extra content (tables, charts)
    if (msg.extra) {
      if (msg.extra.type === 'table') {
        const table = this._buildMiniTable(msg.extra.data, msg.extra.columns);
        bubble.appendChild(table);
      }
      if (msg.extra.type === 'chart') {
        const chartWrap = Utils.createElement('div', { className: 'chat-chart-wrap' });
        const canvasId = 'chat-chart-' + (++this.chartCounter);
        const canvas = Utils.createElement('canvas', { id: canvasId });
        chartWrap.appendChild(canvas);
        bubble.appendChild(chartWrap);
        // Render chart after DOM insert
        setTimeout(() => {
          const chartConfig = this.visualizer.buildChartFromQuery(msg.extra.chartType, msg.extra.column);
          if (chartConfig) {
            this.visualizer.createChart(canvasId, chartConfig);
          }
        }, 100);
      }
    }

    const time = Utils.createElement('div', { className: 'chat-time', textContent: msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    bubble.appendChild(time);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    this.chatContainer.appendChild(wrapper);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    // Animate in
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      wrapper.style.transition = 'all 0.3s ease';
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0)';
    });
  }

  _buildMiniTable(data, columns) {
    const wrap = Utils.createElement('div', { className: 'chat-table-wrap' });
    const table = Utils.createElement('table', { className: 'chat-table' });
    const thead = Utils.createElement('thead');
    const headerRow = Utils.createElement('tr');
    const displayCols = columns.slice(0, 6);
    displayCols.forEach(col => {
      headerRow.appendChild(Utils.createElement('th', { textContent: col }));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = Utils.createElement('tbody');
    data.slice(0, 10).forEach(row => {
      const tr = Utils.createElement('tr');
      displayCols.forEach(col => {
        const val = row[col];
        tr.appendChild(Utils.createElement('td', { textContent: val !== null && val !== undefined ? String(val) : '—' }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    if (data.length > 10) {
      wrap.appendChild(Utils.createElement('div', { className: 'chat-table-more', textContent: `... and ${data.length - 10} more rows` }));
    }
    return wrap;
  }

  _addThinking() {
    const wrapper = Utils.createElement('div', { className: 'chat-message bot' });
    const avatar = Utils.createElement('div', { className: 'chat-avatar', innerHTML: '🤖' });
    const bubble = Utils.createElement('div', { className: 'chat-bubble thinking' });
    bubble.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span></div>';
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    this.chatContainer.appendChild(wrapper);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    return wrapper;
  }

  clear() {
    this.messages = [];
    if (this.chatContainer) this.chatContainer.innerHTML = '';
  }
}
