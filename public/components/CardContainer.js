// CardContainer Component
class CardContainer {
  constructor() {
    this.element = this.createElement();
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'bento-container';
    return container;
  }

  addCard(cardComponent, options = {}) {
    const cardElement = cardComponent.render();
    
    // Apply additional classes if specified
    if (options.className) {
      cardElement.classList.add(options.className);
    }
    
    // Store component reference if needed
    cardElement._component = cardComponent;
    
    this.element.appendChild(cardElement);
  }

  removeCard(cardComponent) {
    if (cardComponent && cardComponent.element) {
      this.element.removeChild(cardComponent.element);
    }
  }

  clear() {
    this.element.innerHTML = '';
  }

  render() {
    return this.element;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardContainer;
}
