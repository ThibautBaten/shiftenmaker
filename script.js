let leidingLijst = JSON.parse(localStorage.getItem('mijnLeiding')) || [];
let evenementShiften = [];

toonLeidingLijst();

function updateCount() {
    document.getElementById('count').innerText = `${leidingLijst.length} personen in database`;
}

function voegLeidingToe() {
    const naam = document.getElementById('naam').value;
    const haatTaak = document.getElementById('haat').value;
    const van = document.getElementById('beschikbaarVan').value;
    const tot = document.getElementById('beschikbaarTot').value;
    
    if (naam) {
        leidingLijst.push({ 
            naam, 
            haatTaak, 
            beperkt: (van && tot), 
            van: van || "00:00", 
            tot: tot || "23:59" 
        });
        localStorage.setItem('mijnLeiding', JSON.stringify(leidingLijst));
        
        // Reset velden
        document.getElementById('naam').value = '';
        document.getElementById('haat').value = '';
        document.getElementById('beschikbaarVan').value = '';
        document.getElementById('beschikbaarTot').value = '';
        
        toonLeidingLijst();
    }
}

function toonLeidingLijst() {
    const display = document.getElementById('leiding-display-lijst');
    display.innerHTML = "";
    leidingLijst.forEach((l, index) => {
        const li = document.createElement('li');
        let info = l.haatTaak ? ` (Geen ${l.haatTaak})` : '';
        let tijd = l.beperkt ? ` [${l.van}-${l.tot}]` : '';
        
        li.innerHTML = `<span><strong>${l.naam}</strong>${info}${tijd}</span>
                        <button class="delete-btn" onclick="verwijderLeiding(${index})">✕</button>`;
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
        document.getElementById('taak').value = '';
        document.getElementById('aantal').value = '';
    }
}

function updateShiftLijstDisplay() {
    const display = document.getElementById('geplande-shiften-lijst');
    display.innerHTML = "";
    evenementShiften.forEach((s, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>📌 ${s.taakNaam} (${s.aantal} pers.) | ${s.start}-${s.eind}</span>
                        <button class="delete-btn" onclick="verwijderShift(${index})">✕</button>`;
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

    let ingeplandeLeidingLog = []; 
    let alleIngezetteNamen = new Set();

    evenementShiften.sort((a, b) => a.start.localeCompare(b.start));

    evenementShiften.forEach(shift => {
        // 1. Filter: Haat-taak check
        let kandidaten = leidingLijst.filter(l => l.haatTaak.toLowerCase() !== shift.taakNaam.toLowerCase());
        
        // 2. Filter: Tijd check (Past deze leiding wel binnen de shift tijden?)
        kandidaten = kandidaten.filter(l => {
            // Check of de shift binnen hun persoonlijke uren valt
            return shift.start >= l.van && shift.eind <= l.tot;
        });

        // 3. Filter: Overlap check (Zijn ze niet al elders bezig op dit moment?)
        kandidaten = kandidaten.filter(l => {
            const overlap = ingeplandeLeidingLog.some(p => 
                p.naam === l.naam && 
                !(shift.start >= p.eind || shift.eind <= p.start)
            );
            return !overlap;
        });

        if (kandidaten.length < shift.aantal) {
            fouten.innerHTML += `<div class="error">⚠️ Tekort voor ${shift.taakNaam}! Nodig: ${shift.aantal}, Beschikbaar: ${kandidaten.length}</div>`;
        }

        let gekozen = kandidaten.sort(() => 0.5 - Math.random()).slice(0, shift.aantal);
        
        gekozen.forEach(l => {
            ingeplandeLeidingLog.push({ naam: l.naam, start: shift.start, eind: shift.eind });
            alleIngezetteNamen.add(l.naam);
        });

        output.innerHTML += `
            <div class="shift-card">
                <strong>📍 ${shift.taakNaam}</strong><br>
                <span>⏰ ${shift.start} - ${shift.eind}</span><br>
                <span>👥 ${gekozen.map(l => l.naam).join(', ') || "<i>Niemand beschikbaar</i>"}</span>
            </div>`;
    });

    let nietIngezet = leidingLijst.filter(l => !alleIngezetteNamen.has(l.naam));
    if (nietIngezet.length > 0) {
        fouten.innerHTML += `<div class="warning">ℹ️ ${nietIngezet.length} personen hebben nog geen taak: ${nietIngezet.map(l => l.naam).join(', ')}</div>`;
    }
}

function resetEvenement() {
    evenementShiften = [];
    updateShiftLijstDisplay();
    document.getElementById('rooster-output').innerHTML = "";
    document.getElementById('foutmeldingen').innerHTML = "";
}

function wisGeheugen() {
    if (confirm("Database wissen?")) {
        localStorage.removeItem('mijnLeiding');
        leidingLijst = [];
        toonLeidingLijst();
        location.reload();
    }
}