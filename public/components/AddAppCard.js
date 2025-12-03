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
        
        <button type="submit">Add Application</button>
      </form>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#addAppForm');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const appName = this.element.querySelector('#appName').value;
      
      if (appName.trim()) {
        this.onAppAdded(appName);
        form.reset();
      }
    });
  }

  onAppAdded(appName) {
    // Emit custom event for app added
    const event = new CustomEvent('appAdded', {
      detail: { appName }
    });
    document.dispatchEvent(event);
    
    // Default alert - can be overridden
    alert(`Application "${appName}" has been added!`);
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddAppCard;
}
