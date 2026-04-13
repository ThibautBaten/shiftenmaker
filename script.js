// Data laden uit localStorage
let leidingLijst = JSON.parse(localStorage.getItem('mijnLeiding')) || [];
let evenementShiften = [];

// Bij opstarten lijst tonen
toonLeidingLijst();

function updateCount() {
    document.getElementById('count').innerText = `${leidingLijst.length} personen in database`;
}

function voegLeidingToe() {
    const naam = document.getElementById('naam').value;
    const haatTaak = document.getElementById('haat').value;
    
    if (naam) {
        leidingLijst.push({ naam, haatTaak });
        localStorage.setItem('mijnLeiding', JSON.stringify(leidingLijst));
        document.getElementById('naam').value = '';
        document.getElementById('haat').value = '';
        toonLeidingLijst();
    } else {
        alert("Vul een naam in!");
    }
}

function toonLeidingLijst() {
    const display = document.getElementById('leiding-display-lijst');
    display.innerHTML = "";

    leidingLijst.forEach((l, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${l.naam}</strong> ${l.haatTaak ? `(Geen ${l.haatTaak})` : ''}</span>
            <button class="delete-btn" onclick="verwijderLeiding(${index})">✕</button>
        `;
        display.appendChild(li);
    });
    updateCount();
}

function verwijderLeiding(index) {
    leidingLijst.splice(index, 1);
    localStorage.setItem('mijnLeiding', JSON.stringify(leidingLijst));
    toonLeidingLijst();
}

function voegShiftToeAanLijst() {
    const taakNaam = document.getElementById('taak').value;
    const aantal = parseInt(document.getElementById('aantal').value);
    const start = document.getElementById('starttijd').value;
    const eind = document.getElementById('eindtijd').value;
    
    if (taakNaam && aantal && start && eind) {
        evenementShiften.push({ taakNaam, aantal, start, eind });
        updateShiftLijstDisplay();
        
        // Velden leegmaken
        document.getElementById('taak').value = '';
        document.getElementById('aantal').value = '';
    } else {
        alert("Vul alle gegevens van de shift in!");
    }
}

function updateShiftLijstDisplay() {
    const display = document.getElementById('geplande-shiften-lijst');
    display.innerHTML = "";
    evenementShiften.forEach((s, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>📌 ${s.taakNaam} (${s.aantal} pers.) | ${s.start} - ${s.eind}</span>
            <button class="delete-btn" onclick="verwijderShift(${index})">✕</button>
        `;
        display.appendChild(li);
    });
}

function verwijderShift(index) {
    evenementShiften.splice(index, 1);
    updateShiftLijstDisplay();
}

function genereerVolledigRooster() {
    const output = document.getElementById('rooster-output');
    const fouten = document.getElementById('foutmeldingen');
    output.innerHTML = "<h2>Definitief Rooster</h2>";
    fouten.innerHTML = "";

    if (evenementShiften.length === 0) return alert("Voeg eerst shiften toe!");

    let ingeplandeLeidingPerTijd = []; 
    let alleIngezetteNamen = new Set();

    // Sorteer shiften op starttijd
    evenementShiften.sort((a, b) => a.start.localeCompare(b.start));

    evenementShiften.forEach(shift => {
        // 1. Filter: Wie wil de taak niet doen?
        let kandidaten = leidingLijst.filter(l => l.haatTaak.toLowerCase() !== shift.taakNaam.toLowerCase());
        
        // 2. Filter: Wie is al aan het werk op dit tijdstip?
        kandidaten = kandidaten.filter(l => {
            const overlap = ingeplandeLeidingPerTijd.some(p => 
                p.naam === l.naam && 
                !(shift.start >= p.eind || shift.eind <= p.start)
            );
            return !overlap;
        });

        if (kandidaten.length < shift.aantal) {
            fouten.innerHTML += `<div class="error">⚠️ Tekort voor ${shift.taakNaam}! Nodig: ${shift.aantal}, Beschikbaar: ${kandidaten.length}</div>`;
        }

        // Shuffle kandidaten voor eerlijke verdeling
        let gekozen = kandidaten.sort(() => 0.5 - Math.random()).slice(0, shift.aantal);
        
        gekozen.forEach(l => {
            ingeplandeLeidingPerTijd.push({ naam: l.naam, start: shift.start, eind: shift.eind });
            alleIngezetteNamen.add(l.naam);
        });

        output.innerHTML += `
            <div class="shift-card">
                <strong>📍 ${shift.taakNaam}</strong><br>
                <span>⏰ Tijd: ${shift.start} - ${shift.eind}</span><br>
                <span>👥 Leiding: ${gekozen.map(l => l.naam).join(', ') || "<i>Niemand toegewezen</i>"}</span>
            </div>
        `;
    });

    // Controle: Heeft iedereen een taak?
    let nietIngezet = leidingLijst.filter(l => !alleIngezetteNamen.has(l.naam));
    if (nietIngezet.length > 0) {
        fouten.innerHTML += `<div class="warning">ℹ️ ${nietIngezet.length} personen hebben nog geen taak: ${nietIngezet.map(l => l.naam).join(', ')}</div>`;
    } else if (leidingLijst.length > 0) {
        fouten.innerHTML += `<div class="shift-card" style="border-left-color: blue;">✅ Perfect! Iedereen uit de database is ingezet.</div>`;
    }
}

function resetEvenement() {
    evenementShiften = [];
    updateShiftLijstDisplay();
    document.getElementById('rooster-output').innerHTML = "";
    document.getElementById('foutmeldingen').innerHTML = "";
}

function wisGeheugen() {
    if (confirm("Weet je zeker dat je de hele database met leiding wilt wissen?")) {
        localStorage.removeItem('mijnLeiding');
        leidingLijst = [];
        toonLeidingLijst();
        location.reload();
    }
}