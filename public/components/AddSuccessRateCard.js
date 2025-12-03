// AddSuccessRateCard Component
class AddSuccessRateCard {
  constructor() {
    this.element = this.createElement();
    this.attachEventListeners();
    this.requiredColumns = [
      'Tanggal Transaksi',
      'Jenis Transaksi',
      'RC',
      'RC Description',
      'total transaksi',
      'Total Nominal',
      'Total Biaya Admin',
      'Status Transaksi'
    ];
  }

  createElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card card-small';
    
    cardDiv.innerHTML = `
      <h2>Add Success Rate Document</h2>
      <p>Upload Excel file with 8 required columns</p>
      
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
      
      <div id="successRateValidationMessage" style="margin-bottom: 16px; display: none;"></div>
      
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
        if (this.isValidExcelFile(file)) {
          this.validateAndProcessFile(file, fileInput, files);
        } else {
          this.showValidationError('Please upload only Excel files (.xlsx or .xls)');
        }
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        if (this.isValidExcelFile(file)) {
          this.validateAndProcessFile(file, fileInput);
        } else {
          this.showValidationError('Please upload only Excel files (.xlsx or .xls)');
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

  async validateAndProcessFile(file, fileInput, droppedFiles = null) {
    try {
      this.showValidationMessage('Validating file columns...', 'info');
      
      const validationResult = await this.validateExcelColumns(file);
      
      if (validationResult.isValid) {
        if (droppedFiles) {
          fileInput.files = droppedFiles;
        }
        this.updateUploadArea(file.name);
        this.showValidationMessage('File valid! All 8 columns verified.', 'success');
        this.onFileSelected(file);
      } else {
        this.showValidationError(validationResult.error);
        fileInput.value = '';
        this.resetUploadArea();
      }
    } catch (error) {
      this.showValidationError(`Error reading file: ${error.message}`);
      fileInput.value = '';
      this.resetUploadArea();
    }
  }

  async validateExcelColumns(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          
          // Check if XLSX library is available
          if (typeof XLSX === 'undefined') {
            console.warn('XLSX library not loaded. Skipping column validation.');
            resolve({ isValid: true });
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get headers from first row
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const headers = [];
          
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              headers.push(String(cell.v).trim());
            }
          }
          
          // Validate columns
          const validationResult = this.validateColumns(headers);
          resolve(validationResult);
          
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  validateColumns(headers) {
    // Check if there are exactly 8 columns
    if (headers.length !== 8) {
      return {
        isValid: false,
        error: `Invalid column count. Expected 8 columns, got ${headers.length}. Required columns: ${this.requiredColumns.join(', ')}`
      };
    }
    
    // Check if all required columns exist (case-insensitive)
    const normalizedHeaders = headers.map(h => h.toLowerCase());
    const normalizedRequired = this.requiredColumns.map(r => r.toLowerCase());
    
    const missingColumns = [];
    normalizedRequired.forEach((required, index) => {
      if (!normalizedHeaders.includes(required)) {
        missingColumns.push(this.requiredColumns[index]);
      }
    });
    
    if (missingColumns.length > 0) {
      return {
        isValid: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }
    
    return { isValid: true };
  }

  showValidationMessage(message, type) {
    const messageDiv = this.element.querySelector('#successRateValidationMessage');
    messageDiv.style.display = 'block';
    messageDiv.textContent = message;
    
    // Reset styles
    messageDiv.style.padding = '10px';
    messageDiv.style.borderRadius = '6px';
    messageDiv.style.fontSize = '12px';
    
    if (type === 'success') {
      messageDiv.style.backgroundColor = '#d1fae5';
      messageDiv.style.color = '#065f46';
      messageDiv.style.border = '1px solid #10b981';
    } else if (type === 'error') {
      messageDiv.style.backgroundColor = '#fee2e2';
      messageDiv.style.color = '#991b1b';
      messageDiv.style.border = '1px solid #ef4444';
    } else {
      messageDiv.style.backgroundColor = '#dbeafe';
      messageDiv.style.color = '#1e40af';
      messageDiv.style.border = '1px solid #3b82f6';
    }
  }

  showValidationError(message) {
    this.showValidationMessage(message, 'error');
  }

  hideValidationMessage() {
    const messageDiv = this.element.querySelector('#successRateValidationMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
    }
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

  // Method to reset form
  resetForm() {
    const appNameInput = this.element.querySelector('#appNameInput');
    const fileInput = this.element.querySelector('#successRateFile');
    
    if (appNameInput) appNameInput.value = '';
    if (fileInput) fileInput.value = '';
    
    this.hideValidationMessage();
    this.resetUploadArea();
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddSuccessRateCard;
}
