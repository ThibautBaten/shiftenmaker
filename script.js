// Bij het opstarten: haal de lijst op uit het geheugen of begin met een lege lijst
let werknemers = JSON.parse(localStorage.getItem('mijnWerknemers')) || [];

// Update de interface direct bij het laden
toonWerknemersLijst();

function voegWerknemerToe() {
    const naam = document.getElementById('naam').value;
    const haatTaak = document.getElementById('haat').value;
    
    if(naam) {
        werknemers.push({ naam, haatTaak });
        
        // OPSLAAN in localStorage
        localStorage.setItem('mijnWerknemers', JSON.stringify(werknemers));
        
        alert(`${naam} toegevoegd!`);
        document.getElementById('naam').value = '';
        document.getElementById('haat').value = '';
        toonWerknemersLijst();
    }
}

function toonWerknemersLijst() {
    // Optioneel: toon een lijstje van alle 30 mensen in je GUI
    console.log("Huidige werknemers in geheugen:", werknemers);
}

function wisGeheugen() {
    if(confirm("Weet je zeker dat je alle 30 werknemers wilt wissen?")) {
        localStorage.removeItem('mijnWerknemers');
        werknemers = [];
        location.reload(); // Ververs de pagina
    }
}

// ... de rest van je genereerRoosterClick() functie blijft hetzelfde ...