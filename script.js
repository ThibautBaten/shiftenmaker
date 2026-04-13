// 1. INITIALISATIE: DATA LADEN
let leidingLijst = JSON.parse(localStorage.getItem('mijnLeiding')) || [];
let evenementShiften = JSON.parse(localStorage.getItem('mijnShiften')) || [];

window.onload = function() {
    toonLeidingLijst();
    updateShiftLijstDisplay();
};

// 2. STRIKTE HAAT-CONTROLE FUNCTIE
function isHaatMatch(persoonHaat, shiftTaak) {
    if (!persoonHaat) return false;
    // Vergelijkt exacte tekst, negeert hoofdletters en extra spaties
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
        // Velden leegmaken
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
    if (confirm("Deze persoon verwijderen uit de database?")) {
        leidingLijst.splice(index, 1);
        saveData();
        toonLeidingLijst();
    }
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
        // Velden leegmaken
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

// 5. DATA OPSLAAN & BACK-UP
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
    URL.revokeObjectURL(url);
}

function importeerData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            leidingLijst = data.leiding || [];
            evenementShiften = data.shiften || [];
            saveData();
            toonLeidingLijst();
            updateShiftLijstDisplay();
            alert("Back-up succesvol ingeladen!");
        } catch (err) {
            alert("Ongeldig back-up bestand.");
        }
    };
    reader.readAsText(file);
}

// 6. DE GENERATOR (MET SLIMME WISSEL-LOGICA)
function genereerVolledigRooster() {
    const output = document.getElementById('rooster-output');
    const fouten = document.getElementById('foutmeldingen');
    
    // Reset scherm
    output.innerHTML = "<h2>Definitief Rooster</h2>";
    fouten.innerHTML = "";

    if (evenementShiften.length === 0 || leidingLijst.length === 0) {
        return alert("Vul eerst leiding en shiften in!");
    }

    let werkShiften = evenementShiften.map(s => ({ ...s, mensen: [] }));
    let ingeplandeMensen = [];

    // Schud leiding voor een nieuw resultaat bij elke klik
    let geshuffeldeLeiding = [...leidingLijst].sort(() => 0.5 - Math.random());

    // Sorteer op 'moeilijkheidsgraad' (mensen met haat of tijdslimiet eerst)
    let gesorteerdeLeiding = geshuffeldeLeiding.sort((a, b) => {
        let scoreA = (a.haatTaak ? 10 : 0) + (a.van !== "00:00" || a.tot !== "23:59" ? 5 : 0);
        let scoreB = (b.haatTaak ? 10 : 0) + (b.van !== "00:00" || b.tot !== "23:59" ? 5 : 0);
        return scoreB - scoreA;
    });

    // STAP A: Eerste pass (directe plaatsing)
    gesorteerdeLeiding.forEach(persoon => {
        let gelukt = probeerPlaatsing(persoon, werkShiften);
        if (gelukt) ingeplandeMensen.push(persoon.naam);
    });

    // STAP B: Tweede pass (Wissellogica voor de overblijvers)
    let overblijvers = gesorteerdeLeiding.filter(p => !ingeplandeMensen.includes(p.naam));
    
    overblijvers.forEach(persoon => {
        for (let shift of werkShiften) {
            if (ingeplandeMensen.includes(persoon.naam)) break;

            // Kan deze persoon fysiek in deze shift?
            if (!isHaatMatch(persoon.haatTaak, shift.taakNaam) && persoon.van <= shift.start && persoon.tot >= shift.eind) {
                
                // Probeer te ruilen met iemand die er al in zit
                for (let i = 0; i < shift.mensen.length; i++) {
                    let persoonInShiftNaam = shift.mensen[i];
                    let persoonInShiftObj = leidingLijst.find(l => l.naam === persoonInShiftNaam);

                    // Kan de persoon die er al in zit naar een ANDERE shift verhuizen?
                    for (let andereShift of werkShiften) {
                        if (andereShift === shift) continue;
                        if (andereShift.mensen.length < andereShift.aantal && 
                            !isHaatMatch(persoonInShiftObj.haatTaak, andereShift.taakNaam) &&
                            persoonInShiftObj.van <= andereShift.start && persoonInShiftObj.tot >= andereShift.eind) {
                            
                            // DE WISSEL
                            andereShift.mensen.push(persoonInShiftNaam);
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

    // 7. RESULTATEN TEKENEN
    werkShiften.forEach(shift => {
        output.innerHTML += `
            <div class="shift-card">
                <strong>📍 ${shift.taakNaam.toUpperCase()}</strong> (${shift.mensen.length}/${shift.aantal})<br>
                <span>⏰ ${shift.start} - ${shift.eind}</span><br>
                <span>👥 ${shift.mensen.join(', ') || "<i>Niemand ingepland</i>"}</span>
            </div>`;
    });

    let finaleNietIngepland = leidingLijst.filter(p => !ingeplandeMensen.includes(p.naam));
    if (finaleNietIngepland.length > 0) {
        let foutHTML = `<div class="error-box"><h3>⚠️ Niet iedereen kon geplaatst worden</h3><ul>`;
        finaleNietIngepland.forEach(p => foutHTML += `<li>${p.naam}</li>`);
        foutHTML += `</ul><p><small>Tip: Voeg meer shift-plekken toe of check tijdsbeperkingen.</small></p></div>`;
        fouten.innerHTML = foutHTML;
    } else {
        fouten.innerHTML = `<div class="shift-card" style="border-left-color: blue; background: #eef7ff;">✅ Iedereen is ingepland! Druk opnieuw voor een andere variatie.</div>`;
    }
}

function probeerPlaatsing(persoon, shiften) {
    // Sorteer shiften op 'leegste eerst' om gaten te vullen
    let gesorteerdeShiften = [...shiften].sort((a, b) => a.mensen.length - b.mensen.length);
    for (let shift of gesorteerdeShiften) {
        if (shift.mensen.length < shift.aantal && 
            !isHaatMatch(persoon.haatTaak, shift.taakNaam) &&
            persoon.van <= shift.start && persoon.tot >= shift.eind) {
            shift.mensen.push(persoon.naam);
            return true;
        }
    }
    return false;
}

// RESET ACTIES
function wisLeidingGeheugen() { if (confirm("Hele leiding database wissen?")) { localStorage.removeItem('mijnLeiding'); location.reload(); } }
function wisShiftenGeheugen() { if (confirm("Alle shiften wissen?")) { localStorage.removeItem('mijnShiften'); location.reload(); } }