// Inicializar autocomplete
document.addEventListener('DOMContentLoaded', function() {
    initAutocomplete();
});

function initAutocomplete() {
    // Configurar autocomplete para cada campo de búsqueda
    const searchInputs = [
        'menu-search-input',
        'simple-search-input',
        'complete-search-input',
        'deck1-search',
        'deck2-search'
    ];
    
    searchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            setupAutocomplete(input);
        }
    });
}

function setupAutocomplete(input) {
    input.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.length < 2) {
            hideAutocomplete(this);
            return;
        }
        
        const results = searchDecks(value);
        showAutocomplete(this, results);
    });
    
    // Ocultar al hacer clic fuera
    input.addEventListener('blur', function() {
        setTimeout(() => hideAutocomplete(this), 200);
    });
}

function searchDecks(query) {
    const normalizedQuery = query.toLowerCase();
    return Object.keys(decks).filter(deckName => 
        deckName.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Limitar a 10 resultados
}

function showAutocomplete(input, results) {
    const dropdownId = `${input.id}-autocomplete`;
    let dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'autocomplete-dropdown';
        input.parentNode.appendChild(dropdown);
    }
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item">No se encontraron decks</div>';
    } else {
        dropdown.innerHTML = results.map(deckName => 
            `<div class="autocomplete-item" data-deck="${deckName}">${deckName}</div>`
        ).join('');
        
        // Agregar evento a los items
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                input.value = this.dataset.deck;
                hideAutocomplete(input);
                
                // Ejecutar búsqueda si es necesario
                if (input.id.includes('search')) {
                    triggerSearch(input);
                }
            });
        });
    }
    
    dropdown.style.display = 'block';
}

function hideAutocomplete(input) {
    const dropdownId = `${input.id}-autocomplete`;
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function triggerSearch(input) {
    if (input.id === 'simple-search-input') {
        searchSimpleDeck();
    } else if (input.id === 'complete-search-input') {
        searchCompleteDeck();
    } else if (input.id === 'menu-search-input') {
        // Buscar en el menú
        const deckName = input.value.trim();
        if (deckName) {
            const found = findDeckByName(deckName);
            if (found) {
                document.getElementById('complete-search-input').value = deckName;
                switchView('search-complete');
                searchCompleteDeck(deckName);
            }
        }
    } else if (input.id === 'deck1-search' || input.id === 'deck2-search') {
        updateComparator();
    }
}
