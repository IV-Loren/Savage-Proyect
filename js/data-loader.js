// Cargar todos los datos
async function loadAllData() {
    try {
        // Cargar datos de decks
        const decksResponse = await fetch('data/decks.json');
        decks = await decksResponse.json();
        
        // Cargar matchups
        const matchupsResponse = await fetch('data/matchups.json');
        matchups = await matchupsResponse.json();
        
        // Cargar datos adicionales
        const additionalResponse = await fetch('data/additional.json');
        additional = await additionalResponse.json();
        
        // Cargar side deck cards
        const sidedeckResponse = await fetch('data/sidedeck-cards.json');
        sidedeckCards = await sidedeckResponse.json();
        
        // Cargar handtraps
        const handtrapsResponse = await fetch('data/handtraps.json');
        handtraps = await handtrapsResponse.json();
        
        console.log('Datos cargados exitosamente');
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Usar datos de ejemplo si hay error
        loadExampleData();
    }
}

// Datos de ejemplo (fallback)
function loadExampleData() {
    decks = {
        "Dragon Link": {
            "type": "Combo",
            "tier": "Tier 1",
            "difficulty": 8,
            "weaknesses": ["Nibiru", "Droll & Lock Bird", "Dimension Shifter"],
            "image": "dragon-link.jpg"
        },
        // ... más decks
    };
    
    sidedeckCards = [
        {
            "name": "Ash Blossom & Joyous Spring",
            "type": "handtrap",
            "description": "Niega efectos que añadan cartas del Deck a la mano o manden al Cementerio.",
            "usage": "95% de los decks",
            "image": "ash-blossom.jpg"
        },
        // ... más cartas
    ];
    
    handtraps = [
        {
            "name": "Ash Blossom & Joyous Spring",
            "tier": "S",
            "image": "ash-blossom.jpg",
            "formats": ["master-duel", "tcg", "ocg"]
        },
        // ... más handtraps
    ];
}