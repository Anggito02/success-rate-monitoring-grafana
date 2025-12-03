// DictionaryUploadCard Component
class DictionaryUploadCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-large';
    
    cardDiv.innerHTML = `
      <h2>Add Dictionary Document</h2>
      <p>Upload dictionary file to process</p>
      
      <div class="form-group">
        <label for="applicationName">Application Name:</label>
        <input 
          type="text" 
          id="applicationName" 
          name="applicationName" 
          placeholder="Enter application name"
          required
        />
      </div>
      
      <div class="upload-area" id="uploadArea">
        <p>Drag & drop your dictionary file here or click to browse</p>
        <input 
          type="file" 
          id="dictionaryFile" 
          name="dictionaryFile" 
          accept=".xlsx,.xls,.csv,.json"
          style="display: none;"
        />
      </div>
      
      <button type="button" id="uploadBtn">Upload Dictionary</button>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const uploadArea = this.element.querySelector('#uploadArea');
    const fileInput = this.element.querySelector('#dictionaryFile');
    const uploadBtn = this.element.querySelector('#uploadBtn');

    // Button click
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    // Upload area click
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        this.updateUploadArea(files[0].name);
        this.onFileSelected(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        this.updateUploadArea(file.name);
        this.onFileSelected(file);
      }
    });
  }

  updateUploadArea(fileName) {
    const uploadArea = this.element.querySelector('#uploadArea');
    uploadArea.innerHTML = `<p>File selected: ${fileName}</p>`;
  }

  resetUploadArea() {
    const uploadArea = this.element.querySelector('#uploadArea');
    uploadArea.innerHTML = `
      <p>Drag & drop your dictionary file here or click to browse</p>
      <input 
        type="file" 
        id="dictionaryFile" 
        name="dictionaryFile" 
        accept=".xlsx,.xls,.csv,.json"
        style="display: none;"
      />
    `;
    // Re-attach event listeners after reset
    this.attachEventListeners();
  }

  onFileSelected(file) {
    // Get application name value
    const applicationName = this.element.querySelector('#applicationName').value;
    
    // Emit custom event for file selected
    const event = new CustomEvent('dictionaryFileSelected', {
      detail: { 
        file,
        applicationName
      }
    });
    document.dispatchEvent(event);

    // Default processing - can be overridden
    console.log('Dictionary file selected:', file.name, 'Application Name:', applicationName);
  }

  // Method to get application name
  getApplicationName() {
    return this.element.querySelector('#applicationName').value;
  }

  // Method to reset form
  resetForm() {
    const applicationNameInput = this.element.querySelector('#applicationName');
    const fileInput = this.element.querySelector('#dictionaryFile');
    
    applicationNameInput.value = '';
    fileInput.value = '';
    
    this.resetUploadArea();
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DictionaryUploadCard;
}
