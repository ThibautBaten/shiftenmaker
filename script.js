// 1. DATA LADEN BIJ OPSTARTEN
let leidingLijst = JSON.parse(localStorage.getItem('mijnLeiding')) || [];
let evenementShiften = JSON.parse(localStorage.getItem('mijnShiften')) || [];

window.onload = function() {
    toonLeidingLijst();
    updateShiftLijstDisplay();
};

// 2. HULPFUNCTIE VOOR STRIKTE HAAT-CONTROLE
function isHaatMatch(persoonHaat, shiftTaak) {
    if (!persoonHaat) return false;
    // Vergelijkt exacte tekst, negeert hoofdletters en spaties rondom
    return persoonHaat.toLowerCase().trim() === shiftTaak.toLowerCase().trim();
}

// 3. LEIDING BEHEREN
function voegLeidingToe() {
    const naam = document.getElementById('naam').value.trim();
    const haatTaak = document.getElementById('haat').value.trim();
    const van = document.getElementById('beschikbaarVan').value;
    const tot = document.getElementById('beschikbaarTot').value;
    
    if (naam) {
        leidingLijst.push({ 
            naam, 
            haatTaak, 
            van: van || "00:00", 
            tot: tot || "23:59" 
        });
        saveData();
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
        li.innerHTML = `<span><strong>${l.naam}</strong> ${l.haatTaak ? `(Haat: ${l.haatTaak})` : ''} [${l.van}-${l.tot}]</span>
                        <button class="delete-btn" onclick="verwijderLeiding(${index})">✕</button>`;
        display.appendChild(li);
    });
    document.getElementById('count').innerText = `${leidingLijst.length} personen in database`;
}

function verwijderLeiding(index) {
    leidingLijst.splice(index, 1);
    saveData();
    toonLeidingLijst();
}

// 4. SHIFTEN BEHEREN
function voegShiftToeAanLijst() {
    const taakNaam = document.getElementById('taak').value.trim();
    const aantal = parseInt(document.getElementById('aantal').value);
    const start = document.getElementById('starttijd').value;
    const eind = document.getElementById('eindtijd').value;
    
    if (taakNaam && aantal && start && eind) {
        evenementShiften.push({ taakNaam, aantal, start, eind });
        saveData();
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
    saveData();
    updateShiftLijstDisplay();
}

// 5. OPSLAAN & BACK-UP
function saveData() {
    localStorage.setItem('mijnLeiding', JSON.stringify(leidingLijst));
    localStorage.setItem('mijnShiften', JSON.stringify(evenementShiften));
}

function exporteerData() {
    const data = { leiding: leidingLijst, shiften: evenementShiften };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planning_backup.json";
    a.click();
}

function importeerData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        leidingLijst = data.leiding;
        evenementShiften = data.shiften;
        saveData();
        toonLeidingLijst();
        updateShiftLijstDisplay();
        alert("Back-up succesvol ingeladen!");
    };
    reader.readAsText(file);
}

// 6. DE GENERATOR (MET WISSEL-LOGICA)
function genereerVolledigRooster() {
    const output = document.getElementById('rooster-output');
    const fouten = document.getElementById('foutmeldingen');
    output.innerHTML = "<h2>Definitief Rooster</h2>";
    fouten.innerHTML = "";

    if (evenementShiften.length === 0 || leidingLijst.length === 0) return alert("Vul eerst alles in!");

    let werkShiften = evenementShiften.map(s => ({ ...s, mensen: [] }));
    let ingeplandeMensen = [];

    // Prioriteit: Mensen met haat-taken of tijdslimieten eerst plannen
    let gesorteerdeLeiding = [...leidingLijst].sort((a, b) => {
        let scoreA = (a.haatTaak ? 10 : 0) + (a.van !== "00:00" ? 5 : 0);
        let scoreB = (b.haatTaak ? 10 : 0) + (b.van !== "00:00" ? 5 : 0);
        return scoreB - scoreA;
    });

    // Ronde 1: Directe toewijzing
    gesorteerdeLeiding.forEach(persoon => {
        let gelukt = probeerPlaatsing(persoon, werkShiften);
        if (gelukt) ingeplandeMensen.push(persoon.naam);
    });

    // Ronde 2: Wisselen als iemand overblijft
    let overblijvers = gesorteerdeLeiding.filter(p => !ingeplandeMensen.includes(p.naam));
    overblijvers.forEach(persoon => {
        for (let shift of werkShiften) {
            if (ingeplandeMensen.includes(persoon.naam)) break;

            // Kan deze persoon overhaupt in deze shift (haat/tijd)?
            if (!isHaatMatch(persoon.haatTaak, shift.taakNaam) && persoon.van <= shift.start && persoon.tot >= shift.eind) {
                // Zoek iemand om mee te ruilen
                for (let i = 0; i < shift.mensen.length; i++) {
                    let persoonInShift = leidingLijst.find(l => l.naam === shift.mensen[i]);
                    
                    // Zoek een andere plek voor de persoon die we wegjagen
                    for (let andereShift of werkShiften) {
                        if (andereShift === shift) continue;
                        if (andereShift.mensen.length < andereShift.aantal && 
                            !isHaatMatch(persoonInShift.haatTaak, andereShift.taakNaam) &&
                            persoonInShift.van <= andereShift.start && persoonInShift.tot >= andereShift.eind) {
                            
                            // De Ruil
                            andereShift.mensen.push(persoonInShift.naam);
                            shift.mensen[i] = persoon.naam;
                            ingeplandeMensen.push(persoon.naam);
                            break;
                        }
                    }
                    if (ingeplandeMensen.includes(persoon.naam)) break;
                }
            }
        }
    });

    // Toon resultaat
    werkShiften.forEach(shift => {
        output.innerHTML += `
            <div class="shift-card">
                <strong>📍 ${shift.taakNaam.toUpperCase()}</strong> (${shift.mensen.length}/${shift.aantal})<br>
                <span>⏰ ${shift.start} - ${shift.eind}</span><br>
                <span>👥 ${shift.mensen.join(', ') || "<i>Niemand</i>"}</span>
            </div>`;
    });

    // Foutmeldingen voor de overblijvers
    let finaleNietIngepland = leidingLijst.filter(p => !ingeplandeMensen.includes(p.naam));
    if (finaleNietIngepland.length > 0) {
        fouten.innerHTML = `<div class="error-box"><h3>⚠️ Te weinig plek</h3><p>Kon niet iedereen plaatsen:</p><ul>` + 
            finaleNietIngepland.map(p => `<li>${p.naam}</li>`).join('') + `</ul></div>`;
    }
}

function probeerPlaatsing(persoon, shiften) {
    for (let shift of shiften) {
        if (shift.mensen.length < shift.aantal && 
            !isHaatMatch(persoon.haatTaak, shift.taakNaam) &&
            persoon.van <= shift.start && persoon.tot >= shift.eind) {
            shift.mensen.push(persoon.naam);
            return true;
        }
    }
    return false;
}

// 7. RESET FUNCTIES
function wisLeidingGeheugen() { if (confirm("Leiding database wissen?")) { localStorage.removeItem('mijnLeiding'); location.reload(); } }
function wisShiftenGeheugen() { if (confirm("Alle shiften wissen?")) { localStorage.removeItem('mijnShiften'); location.reload(); } }