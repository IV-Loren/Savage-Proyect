// data-loader.js - VERSIÓN CORREGIDA
// Cargar todos los datos
async function loadAllData() {
    try {
        // Cargar datos de decks - MODIFICAR A window.decks
        const decksResponse = await fetch('data/decks.json');
        window.decks = await decksResponse.json(); // Cambiado
        
        // Cargar matchups - MODIFICAR A window.matchups
        const matchupsResponse = await fetch('data/matchups.json');
        window.matchups = await matchupsResponse.json(); // Cambiado
        
        // Cargar datos adicionales
        const additionalResponse = await fetch('data/additional.json');
        window.additional = await additionalResponse.json(); // Cambiado
        
        // Cargar side deck cards
        const sidedeckResponse = await fetch('data/sidedeck.json'); // Cambiado a sidedeck.json
        window.sidedeckCards = await sidedeckResponse.json(); // Cambiado
        
        // Cargar handtraps
        const handtrapsResponse = await fetch('data/handtraps.json');
        window.handtraps = await handtrapsResponse.json(); // Cambiado
        
        console.log('Datos cargados exitosamente');
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Usar datos de ejemplo si hay error
        loadExampleData();
    }
}

// Datos de ejemplo (fallback)
function loadExampleData() {
    window.decks = { // Cambiado a window.decks
        "Dragon Link": {
            "type": "Combo",
            "tier": "Tier 1",
            "difficulty": 8,
            "weaknesses": ["Nibiru", "Droll & Lock Bird", "Dimension Shifter"],
            "image": "dragon-link.jpg"
        },
        // ... más decks
    };
    
    window.sidedeckCards = [ // Cambiado a window.sidedeckCards
        {
            "name": "Ash Blossom & Joyous Spring",
            "type": "handtrap",
            "description": "Niega efectos que añadan cartas del Deck a la mano o manden al Cementerio.",
            "usage": "95% de los decks",
            "image": "ash-blossom.jpg"
        },
        // ... más cartas
    ];
    
    window.handtraps = [ // Cambiado a window.handtraps
        {
            "name": "Ash Blossom & Joyous Spring",
            "tier": "S",
            "image": "ash-blossom.jpg",
            "formats": ["master-duel", "tcg", "ocg"]
        },
        // ... más handtraps
    ];
}