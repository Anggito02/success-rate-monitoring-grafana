// AddDetailedReportCard Component
class AddDetailedReportCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-small';
    
    cardDiv.innerHTML = `
      <h2>Add Detailed Report</h2>
      <p>Upload detailed report documents</p>
      
      <div class="upload-area" id="detailedReportUploadArea">
        <p>Drag & drop your report files here or click to browse</p>
        <input 
          type="file" 
          id="detailedReportFile" 
          name="detailedReportFile" 
          accept=".xlsx,.xls,.csv,.json,.pdf,.doc,.docx"
          style="display: none;"
          multiple
        />
      </div>
      
      <button type="button" id="uploadDetailedReportBtn">Upload Report</button>
    `;
    
    return cardDiv;
  }

  attachEventListeners() {
    const uploadArea = this.element.querySelector('#detailedReportUploadArea');
    const fileInput = this.element.querySelector('#detailedReportFile');
    const uploadBtn = this.element.querySelector('#uploadDetailedReportBtn');

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
        this.updateUploadArea(files);
        this.onFilesSelected(Array.from(files));
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        this.updateUploadArea(files);
        this.onFilesSelected(files);
      }
    });
  }

  updateUploadArea(files) {
    const uploadArea = this.element.querySelector('#detailedReportUploadArea');
    if (files.length === 1) {
      uploadArea.innerHTML = `<p>File selected: ${files[0].name}</p>`;
    } else if (files.length > 1) {
      const fileNames = files.map(file => file.name).join(', ');
      uploadArea.innerHTML = `<p>${files.length} files selected: ${fileNames}</p>`;
    }
  }

  resetUploadArea() {
    const uploadArea = this.element.querySelector('#detailedReportUploadArea');
    
    uploadArea.innerHTML = `
      <p>Drag & drop your report files here or click to browse</p>
      <input 
        type="file" 
        id="detailedReportFile" 
        name="detailedReportFile" 
        accept=".xlsx,.xls,.csv,.json,.pdf,.doc,.docx"
        style="display: none;"
        multiple
      />
    `;
    
    // Re-attach event listeners after reset
    this.attachEventListeners();
  }

  onFilesSelected(files) {
    // Emit custom event for detailed report files selected
    const event = new CustomEvent('detailedReportFilesSelected', {
      detail: { files }
    });
    document.dispatchEvent(event);

    // Default processing - can be overridden
    console.log('Detailed report files selected:', files.map(f => f.name));
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddDetailedReportCard;
}
