// DictionaryUploadCard Component
class DictionaryUploadCard {
    constructor() {
        this.element = this.createElement();
        this.requiredColumns = ['Jenis Transaksi', 'RC', 'S/N'];
        this.selectedFile = null;
        this.loadApplications();
    }

    async loadApplications() {
        try {
            const response = await fetch('/api/applications');
            const result = await response.json();

            if (result.success) {
                this.populateApplicationDropdown(result.data);
            } else {
                console.error('Failed to load applications:', result.message);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }

        // Attach event listeners after loading applications
        this.attachEventListeners();
    }

    populateApplicationDropdown(applications) {
        const select = this.element.querySelector('#applicationSelect');
        const defaultOption = select.querySelector('option[value=""]');

        // Clear existing options except default
        select.innerHTML = '';
        select.appendChild(defaultOption);

        applications.forEach(app => {
            const option = document.createElement('option');
            option.value = app.id;
            option.textContent = app.app_name;
            select.appendChild(option);
        });
    }

    createElement() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card card-large';

        cardDiv.innerHTML = `
      <h2>Add Dictionary Document</h2>
      <p>Upload dictionary file (Excel with columns: Jenis Transaksi, RC, S/N)</p>

      <div class="form-group">
        <label for="applicationSelect">Application:</label>
        <select id="applicationSelect" name="applicationSelect" required>
          <option value="">-- Select Application --</option>
        </select>
      </div>

      <div class="upload-area" id="uploadArea">
        <p>Drag & drop your Excel file here or click to browse</p>
        <input
          type="file"
          id="dictionaryFile"
          name="dictionaryFile"
          accept=".xlsx,.xls"
          style="display: none;"
        />
      </div>

      <div id="validationMessage" style="margin-bottom: 16px; display: none;"></div>

      <button type="button" id="uploadBtn" disabled>Upload Dictionary</button>
    `;

        return cardDiv;
    }

    attachEventListeners() {
        const uploadArea = this.element.querySelector('#uploadArea');
        const fileInput = this.element.querySelector('#dictionaryFile');
        const uploadBtn = this.element.querySelector('#uploadBtn');
        const applicationSelect = this.element.querySelector('#applicationSelect');

        // Upload button click - now performs the actual upload
        uploadBtn.addEventListener('click', () => {
            this.performUpload();
        });

        // Upload area click - opens file dialog
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

        // Application select change
        applicationSelect.addEventListener('change', () => {
            this.updateUploadButtonState();
        });
    }

    updateUploadButtonState() {
        const uploadBtn = this.element.querySelector('#uploadBtn');
        const applicationSelected = this.getSelectedApplicationId();
        const fileSelected = this.selectedFile !== null;

        uploadBtn.disabled = !(applicationSelected && fileSelected);
    }

    isValidExcelFile(file) {
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    }

    async validateAndProcessFile(file, fileInput, droppedFiles = null) {
        try {
            this.showValidationMessage('Validating file columns...', 'info');

            const isValid = await this.validateExcelColumns(file);

            if (isValid) {
                if (droppedFiles) {
                    fileInput.files = droppedFiles;
                }
                this.updateUploadArea(file.name);
                this.showValidationMessage('File valid! Columns verified.', 'success');
                this.onFileSelected(file);
            } else {
                this.showValidationError(`Invalid file format. Excel must have exactly 3 columns: "${this.requiredColumns.join('", "')}"`);
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
                        resolve(true); // Skip validation if library not available
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
                    const isValid = this.validateColumns(headers);
                    resolve(isValid);

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
        // Check if there are exactly 3 columns
        if (headers.length !== 3) {
            console.log(`Invalid column count. Expected 3, got ${headers.length}`);
            return false;
        }

        // Check if all required columns exist (case-insensitive)
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        const normalizedRequired = this.requiredColumns.map(r => r.toLowerCase());

        const hasAllColumns = normalizedRequired.every(required =>
            normalizedHeaders.includes(required)
        );

        if (!hasAllColumns) {
            console.log('Missing required columns. Expected:', this.requiredColumns, 'Got:', headers);
            return false;
        }

        return true;
    }

    showValidationMessage(message, type) {
        const messageDiv = this.element.querySelector('#validationMessage');
        if (!messageDiv) {
            console.error('Validation message div not found!');
            return;
        }

        messageDiv.style.display = 'block';
        messageDiv.textContent = message;

        // Reset styles
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '6px';

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
        const messageDiv = this.element.querySelector('#validationMessage');
        messageDiv.style.display = 'none';
    }

    updateUploadArea(fileName) {
        const uploadArea = this.element.querySelector('#uploadArea');
        uploadArea.innerHTML = `<p>File selected: ${fileName}</p>`;
    }

    resetUploadArea() {
        const uploadArea = this.element.querySelector('#uploadArea');
        uploadArea.innerHTML = `
      <p>Drag & drop your Excel file here or click to browse</p>
      <input 
        type="file" 
        id="dictionaryFile" 
        name="dictionaryFile" 
        accept=".xlsx,.xls"
        style="display: none;"
      />
    `;
        // Re-attach event listeners after reset
        this.attachEventListeners();
    }

    async onFileSelected(file) {
        // Store the selected file and update UI
        this.selectedFile = file;
        this.updateUploadButtonState();
        this.showValidationMessage('File ready for upload. Select an application to enable upload.', 'success');
    }

    async performUpload() {
        const applicationId = this.getSelectedApplicationId();

        if (!applicationId) {
            this.showValidationError('Please select an application');
            return;
        }

        if (!this.selectedFile) {
            this.showValidationError('Please select a file to upload');
            return;
        }

        const uploadBtn = this.element.querySelector('#uploadBtn');

        try {
            // Show loading state
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
            this.showValidationMessage('Uploading dictionary...', 'info');

            const formData = new FormData();
            formData.append('dictionaryFile', this.selectedFile);
            formData.append('selectedApplicationId', applicationId);

            const response = await fetch('/api/upload-dictionary', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log('Upload successful:', result.message);
                this.showValidationMessage(result.message, 'success');

                // Emit custom event for successful upload
                const event = new CustomEvent('dictionaryFileUploaded', {
                    detail: {
                        file: this.selectedFile,
                        applicationId: result.data.applicationId,
                        applicationName: result.data.applicationName,
                        result
                    }
                });
                document.dispatchEvent(event);

                // Form will be manually reset by the user starting a new upload
                console.log('Upload complete. User can start new upload when ready.');
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            this.showValidationError(`Upload failed: ${error.message}`);
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Dictionary';
        }
    }

    // Method to get selected application ID
    getSelectedApplicationId() {
        const select = this.element.querySelector('#applicationSelect');
        const value = select ? select.value : '';
        return value && value !== '' ? value : null;
    }

    // Method to get selected application name
    getSelectedApplicationName() {
        const select = this.element.querySelector('#applicationSelect');
        const selectedOption = select ? select.options[select.selectedIndex] : null;
        return selectedOption && selectedOption.value !== '' ? selectedOption.textContent : null;
    }

    // Method to reset form
    resetForm() {
        const applicationSelect = this.element.querySelector('#applicationSelect');
        const fileInput = this.element.querySelector('#dictionaryFile');

        if (applicationSelect) applicationSelect.value = '';
        if (fileInput) fileInput.value = '';

        this.selectedFile = null;
        this.updateUploadButtonState();

        this.hideValidationMessage();
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
