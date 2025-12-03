// AddSuccessRateCard Component
class AddSuccessRateCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-small';
    
    cardDiv.innerHTML = `
      <h2>Add Success Rate Document</h2>
      <p>Upload document for success rate analysis</p>
      
      <div class="form-group">
        <label for="appNameInput">Application Name</label>
        <input 
          type="text" 
          id="appNameInput" 
          name="appName" 
          placeholder="Enter application name"
          class="form-input"
        />
      </div>
      
      <div class="upload-area" id="successRateUploadArea">
        <p>Drag & drop your Excel file here or click to browse</p>
        <input 
          type="file" 
          id="successRateFile" 
          name="successRateFile" 
          accept=".xlsx,.xls"
          style="display: none;"
        />
      </div>
      
      <button type="button" id="uploadSuccessRateBtn">Upload Document</button>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const uploadArea = this.element.querySelector('#successRateUploadArea');
    const fileInput = this.element.querySelector('#successRateFile');
    const uploadBtn = this.element.querySelector('#uploadSuccessRateBtn');

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
        const file = files[0];
        // Validate Excel file
        if (this.isValidExcelFile(file)) {
          fileInput.files = files;
          this.updateUploadArea(file.name);
          this.onFileSelected(file);
        } else {
          alert('Please upload only Excel files (.xlsx or .xls)');
        }
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        if (this.isValidExcelFile(file)) {
          this.updateUploadArea(file.name);
          this.onFileSelected(file);
        } else {
          alert('Please upload only Excel files (.xlsx or .xls)');
          fileInput.value = '';
        }
      }
    });
  }

  isValidExcelFile(file) {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  updateUploadArea(fileName) {
    const uploadArea = this.element.querySelector('#successRateUploadArea');
    uploadArea.innerHTML = `<p>File selected: ${fileName}</p>`;
  }

  resetUploadArea() {
    const uploadArea = this.element.querySelector('#successRateUploadArea');
    
    uploadArea.innerHTML = `
      <p>Drag & drop your Excel file here or click to browse</p>
      <input 
        type="file" 
        id="successRateFile" 
        name="successRateFile" 
        accept=".xlsx,.xls"
        style="display: none;"
      />
    `;
    
    // Re-attach event listeners after reset
    this.attachEventListeners();
  }

  getAppName() {
    const appNameInput = this.element.querySelector('#appNameInput');
    return appNameInput ? appNameInput.value.trim() : '';
  }

  onFileSelected(file) {
    const appName = this.getAppName();
    
    // Emit custom event for success rate file selected
    const event = new CustomEvent('successRateFileSelected', {
      detail: { file, appName }
    });
    document.dispatchEvent(event);

    // Default processing - can be overridden
    console.log('Success Rate file selected:', file.name, 'App Name:', appName);
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddSuccessRateCard;
}
