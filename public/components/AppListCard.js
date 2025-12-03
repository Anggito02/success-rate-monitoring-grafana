// AppListCard Component
class AppListCard {
  constructor() {
    this.element = this.createElement();
    this.applications = [];
    this.loadApplications();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-tall';
    
    cardDiv.innerHTML = `
      <h2>Application List</h2>
      <p>List of registered applications</p>
      
      <div id="appListContainer" class="app-list-container">
        <div class="loading-spinner">Loading...</div>
      </div>
      
      <button type="button" id="refreshAppListBtn" class="refresh-btn">
        Refresh List
      </button>
    `;
    
    // Add styles for the app list
    this.addStyles();
    
    return cardDiv;
  }

  addStyles() {
    // Check if styles already exist
    if (document.getElementById('appListCardStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'appListCardStyles';
    style.textContent = `
      .app-list-container {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
      }
      
      .app-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .app-list-item {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.2s ease;
      }
      
      .app-list-item:last-child {
        border-bottom: none;
      }
      
      .app-list-item:hover {
        background-color: #eff6ff;
      }
      
      .app-icon {
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      }
      
      .app-name {
        font-weight: 500;
        color: #1e293b;
      }
      
      .loading-spinner {
        padding: 20px;
        text-align: center;
        color: #64748b;
      }
      
      .error-message {
        padding: 20px;
        text-align: center;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
      }
      
      .empty-message {
        padding: 20px;
        text-align: center;
        color: #64748b;
      }
      
      .refresh-btn {
        background: #10b981;
      }
      
      .refresh-btn:hover {
        background: #059669;
      }
      
      .app-count {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  async loadApplications() {
    const container = this.element.querySelector('#appListContainer');
    
    try {
      container.innerHTML = '<div class="loading-spinner">Loading applications...</div>';
      
      const response = await fetch('/api/applications');
      const result = await response.json();
      
      if (result.success) {
        this.applications = result.data;
        this.renderApplicationList();
      } else {
        throw new Error(result.message || 'Failed to load applications');
      }
    } catch (error) {
      container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
      console.error('Error loading applications:', error);
    }
    
    // Attach refresh button listener after loading
    this.attachEventListeners();
  }

  renderApplicationList() {
    const container = this.element.querySelector('#appListContainer');
    
    if (this.applications.length === 0) {
      container.innerHTML = '<div class="empty-message">No applications found</div>';
      return;
    }
    
    const listHTML = `
      <div class="app-count">Total: ${this.applications.length} applications</div>
      <ul class="app-list">
        ${this.applications.map(app => `
          <li class="app-list-item">
            <div class="app-icon">${this.getInitials(app.app_name)}</div>
            <span class="app-name">${this.escapeHtml(app.app_name)}</span>
          </li>
        `).join('')}
      </ul>
    `;
    
    container.innerHTML = listHTML;
  }

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    const refreshBtn = this.element.querySelector('#refreshAppListBtn');
    
    if (refreshBtn) {
      // Remove existing listeners by cloning
      const newBtn = refreshBtn.cloneNode(true);
      refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
      
      newBtn.addEventListener('click', () => {
        this.loadApplications();
      });
    }
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppListCard;
}
