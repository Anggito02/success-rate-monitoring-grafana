// Main App Component
class App {
    constructor() {
        this.cardContainer = null;
        this.initializeApp();
    }

    initializeApp() {
        this.createCardContainer();
        this.createCards();
        this.attachGlobalEventListeners();
    }

    createCardContainer() {
        this.cardContainer = new CardContainer();
    }

    createCards() {
        // Create and add all cards
        const addAppCard = new AddAppCard();
        const dictionaryUploadCard = new DictionaryUploadCard();
        const addSuccessRateCard = new AddSuccessRateCard();
        const appListCard = new AppListCard();
        const restartDbCard = new RestartDbCard();

        // Add cards to container
        this.cardContainer.addCard(appListCard, { className: 'card-tall' });
        this.cardContainer.addCard(addAppCard);
        this.cardContainer.addCard(dictionaryUploadCard, { className: 'card-large' });
        this.cardContainer.addCard(addSuccessRateCard);
        this.cardContainer.addCard(restartDbCard);
    }

    attachGlobalEventListeners() {
        // Listen for custom events from components
        document.addEventListener('appAdded', (e) => {
            this.handleAppAdded(e.detail.appName);
        });

        document.addEventListener('dictionaryFileSelected', (e) => {
            this.handleDictionaryFileSelected(e.detail.file);
        });

        document.addEventListener('successRateFileSelected', (e) => {
            this.handleSuccessRateFileSelected(e.detail.file);
        });

    }

    handleAppAdded(appName) {
        console.log('App added:', appName);
        // Here you could add logic to save to database or update state
    }

    handleDictionaryFileSelected(file) {
        console.log('Dictionary file selected:', file.name);
        // Here you could add logic to process the uploaded file
    }

    handleSuccessRateFileSelected(file) {
        console.log('Success Rate file selected:', file.name);
        // Here you could add logic to process the success rate document
    }


    render(targetElement) {
        if (targetElement) {
            targetElement.innerHTML = '';
            targetElement.appendChild(this.cardContainer.render());
        }
        return this.cardContainer.render();
    }

    // Method to add new cards dynamically
    addCard(cardComponent, options = {}) {
        this.cardContainer.addCard(cardComponent, options);
    }

    // Method to remove cards
    removeCard(cardComponent) {
        this.cardContainer.removeCard(cardComponent);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}

// Global app instance
window.App = App;
