// AddAppCard Component
class AddAppCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-small';
    
    cardDiv.innerHTML = `
      <h2>Add New App</h2>
      <p>Add application name only</p>
      
      <form id="addAppForm">
        <label for="appName">Application Name</label>
        <input 
          type="text" 
          id="appName" 
          name="appName" 
          placeholder="Enter application name"
          required
        />
        
        <div id="addAppMessage" style="margin-bottom: 16px; display: none;"></div>
        
        <button type="submit" id="addAppBtn">Add Application</button>
      </form>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#addAppForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const appName = this.element.querySelector('#appName').value;
      
      if (appName.trim()) {
        await this.submitApplication(appName.trim());
      }
    });
  }

  async submitApplication(appName) {
    const button = this.element.querySelector('#addAppBtn');
    const form = this.element.querySelector('#addAppForm');
    
    try {
      // Disable button and show loading
      button.disabled = true;
      button.textContent = 'Adding...';
      this.hideMessage();
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appName })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showMessage(`Application "${appName}" has been added successfully!`, 'success');
        form.reset();
        this.onAppAdded(appName);
      } else {
        this.showMessage(result.message || 'Failed to add application', 'error');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      this.showMessage('Error connecting to server', 'error');
    } finally {
      // Re-enable button
      button.disabled = false;
      button.textContent = 'Add Application';
    }
  }

  showMessage(message, type) {
    const messageDiv = this.element.querySelector('#addAppMessage');
    messageDiv.style.display = 'block';
    messageDiv.textContent = message;
    
    // Reset styles
    messageDiv.style.padding = '10px';
    messageDiv.style.borderRadius = '6px';
    messageDiv.style.fontSize = '13px';
    
    if (type === 'success') {
      messageDiv.style.backgroundColor = '#d1fae5';
      messageDiv.style.color = '#065f46';
      messageDiv.style.border = '1px solid #10b981';
    } else if (type === 'error') {
      messageDiv.style.backgroundColor = '#fee2e2';
      messageDiv.style.color = '#991b1b';
      messageDiv.style.border = '1px solid #ef4444';
    }
    
    // Auto hide after 5 seconds for success
    if (type === 'success') {
      setTimeout(() => this.hideMessage(), 5000);
    }
  }

  hideMessage() {
    const messageDiv = this.element.querySelector('#addAppMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
    }
  }

  onAppAdded(appName) {
    // Emit custom event for app added
    const event = new CustomEvent('appAdded', {
      detail: { appName }
    });
    document.dispatchEvent(event);
    
    console.log('Application added:', appName);
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddAppCard;
}
