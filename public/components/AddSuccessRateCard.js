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
      
      <div class="upload-area" id="successRateUploadArea">
        <p>Drag & drop your document here or click to browse</p>
        <input 
          type="file" 
          id="successRateFile" 
          name="successRateFile" 
          accept=".xlsx,.xls,.csv,.json,.pdf"
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
    const uploadArea = this.element.querySelector('#successRateUploadArea');
    uploadArea.innerHTML = `<p>File selected: ${fileName}</p>`;
  }

  resetUploadArea() {
    const uploadArea = this.element.querySelector('#successRateUploadArea');
    
    uploadArea.innerHTML = `
      <p>Drag & drop your document here or click to browse</p>
      <input 
        type="file" 
        id="successRateFile" 
        name="successRateFile" 
        accept=".xlsx,.xls,.csv,.json,.pdf"
        style="display: none;"
      />
    `;
    
    // Re-attach event listeners after reset
    this.attachEventListeners();
  }

  onFileSelected(file) {
    // Emit custom event for success rate file selected
    const event = new CustomEvent('successRateFileSelected', {
      detail: { file }
    });
    document.dispatchEvent(event);

    // Default processing - can be overridden
    console.log('Success Rate file selected:', file.name);
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddSuccessRateCard;
}
