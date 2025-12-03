// QuickActionsCard Component
class QuickActionsCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-small';
    
    cardDiv.innerHTML = `
      <h2>Quick Actions</h2>
      <p>Common operations</p>
      
      <div class="action-buttons">
        <button class="action-btn" data-action="viewReports">View Reports</button>
        <button class="action-btn" data-action="exportData">Export Data</button>
        <button class="action-btn" data-action="settings">Settings</button>
      </div>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const actionButtons = this.element.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.onActionClick(action, e);
      });
    });
  }

  onActionClick(action, event) {
    // Emit custom event for action clicked
    const customEvent = new CustomEvent('quickActionClicked', {
      detail: { action }
    });
    document.dispatchEvent(customEvent);

    // Default actions - can be overridden
    switch (action) {
      case 'viewReports':
        this.handleViewReports();
        break;
      case 'exportData':
        this.handleExportData();
        break;
      case 'settings':
        this.handleSettings();
        break;
    }
  }

  handleViewReports() {
    console.log('View Reports clicked');
    alert('View Reports feature coming soon!');
  }

  handleExportData() {
    console.log('Export Data clicked');
    alert('Export Data feature coming soon!');
  }

  handleSettings() {
    console.log('Settings clicked');
    alert('Settings feature coming soon!');
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuickActionsCard;
}
