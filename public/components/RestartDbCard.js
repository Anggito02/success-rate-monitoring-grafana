// RestartDbCard Component
class RestartDbCard {
    constructor() {
        this.element = this.createElement();
        this.attachEventListeners();
    }

    createElement() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card card-small';
        cardDiv.style.borderColor = '#ef4444'; // Red border to indicate danger/admin action

        cardDiv.innerHTML = `
      <h2 style="color: #ef4444;">Restart Database</h2>
      <p>⚠️ Warning: This will drop all existing tables and recreate them. All data will be lost.</p>
      
      <div id="restartDbMessage" style="margin-bottom: 16px; display: none;"></div>
      
      <button type="button" id="restartDbBtn" style="background-color: #ef4444; color: white;">Restart Database</button>
    `;

        return cardDiv;
    }

    attachEventListeners() {
        const restartBtn = this.element.querySelector('#restartDbBtn');

        restartBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to restart the database? ALL DATA WILL BE LOST!')) {
                await this.restartDatabase();
            }
        });
    }

    async restartDatabase() {
        const messageDiv = this.element.querySelector('#restartDbMessage');
        const restartBtn = this.element.querySelector('#restartDbBtn');

        try {
            // Show loading state
            restartBtn.disabled = true;
            restartBtn.textContent = 'Restarting...';
            this.showMessage('Restarting database...', 'info');

            const response = await fetch('/api/restart-db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(result.message, 'success');
            } else {
                throw new Error(result.message || 'Failed to restart database');
            }
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            restartBtn.disabled = false;
            restartBtn.textContent = 'Restart Database';
        }
    }

    showMessage(message, type) {
        const messageDiv = this.element.querySelector('#restartDbMessage');
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

    render() {
        return this.element;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestartDbCard;
}
