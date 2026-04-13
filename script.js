let werknemers = [];
let shifts = [];

function voegWerknemerToe() {
    const naam = document.getElementById('naam').value;
    const haatTaak = document.getElementById('haat').value;
    if(naam) {
        werknemers.push({ naam, haatTaak });
        alert(`${naam} toegevoegd!`);
        document.getElementById('naam').value = '';
    }
}

function genereerRoosterClick() {
    const taakNaam = document.getElementById('taak').value;
    const aantal = parseInt(document.getElementById('aantal').value);
    
    let beschikbareMensen = [...werknemers];
    let output = document.getElementById('rooster-output');
    let foutDiv = document.getElementById('foutmeldingen');
    
    foutDiv.innerHTML = ""; // Reset
    
    // 1. Filter mensen die de taak niet haten
    let kandidaten = beschikbareMensen.filter(w => w.haatTaak !== taakNaam);

    if (kandidaten.length < aantal) {
        foutDiv.innerHTML = `<p style="color:red">FOUT: Niet genoeg mensen voor ${taakNaam} die dit willen doen!</p>`;
    }

    // 2. Kies mensen willekeurig
    let gekozen = kandidaten.sort(() => 0.5 - Math.random()).slice(0, aantal);
    let overschot = werknemers.filter(w => !gekozen.includes(w));

    // 3. Toon resultaat
    output.innerHTML = `<h3>Resultaat voor ${taakNaam}:</h3><ul>` + 
        gekozen.map(m => `<li>✅ ${m.naam}</li>`).join('') + `</ul>`;

    // 4. Toon overschot
    if(overschot.length > 0) {
        let overschotDiv = document.getElementById('overschot-sectie');
        overschotDiv.innerHTML = `<h3>Overschot:</h3><p>Deze mensen zijn nog vrij: ${overschot.map(m => m.naam).join(', ')}</p>`;
    }
}