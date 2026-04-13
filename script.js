// Gegevens inladen
let leidingLijst = JSON.parse(localStorage.getItem('mijnLeiding')) || [];
let evenementShifts = [];

// Bij opstarten lijst tonen
toonLeidingLijst();

function updateCount() {
    document.getElementById('count').innerText = `${leidingLijst.length} leiding in database`;
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
        evenementShifts.push({ taakNaam, aantal, tijd: `${start} - ${eind}` });
        
        const li = document.createElement('li');
        li.style.padding = "5px 0";
        li.innerText = `📌 ${taakNaam} | ${aantal} pers. | ${start}-${eind}`;
        document.getElementById('geplande-shifts-lijst').appendChild(li);
        
        document.getElementById('taak').value = '';
        document.getElementById('aantal').value = '';
    } else {
        alert("Vul alle gegevens van de shift in!");
    }
}

function genereerVolledigRooster() {
    let pool = [...leidingLijst];
    const output = document.getElementById('rooster-output');
    const fouten = document.getElementById('foutmeldingen');
    const overschotDiv = document.getElementById('overschot-sectie');
    
    output.innerHTML = "";
    fouten.innerHTML = "";
    overschotDiv.innerHTML = "";

    if (evenementShifts.length === 0) return alert("Voeg eerst shifts toe!");

    evenementShifts.forEach(shift => {
        // Filter leiding die de taak niet wil doen
        let kandidaten = pool.filter(l => l.haatTaak.toLowerCase() !== shift.taakNaam.toLowerCase());

        if (kandidaten.length < shift.aantal) {
            fouten.innerHTML += `<div class="error">⚠️ Tekort voor ${shift.taakNaam}! Nodig: ${shift.aantal}, Beschikbaar: ${kandidaten.length}</div>`;
        }

        // Shuffle en kies
        let gekozen = kandidaten.sort(() => 0.5 - Math.random()).slice(0, shift.aantal);
        let gekozenNamen = gekozen.map(l => l.naam);

        // Verwijder uit pool zodat ze niet dubbel gepland worden
        pool = pool.filter(l => !gekozenNamen.includes(l.naam));

        output.innerHTML += `
            <div class="shift-card">
                <strong>📍 ${shift.taakNaam}</strong><br>
                <span>⏰ Tijd: ${shift.tijd}</span><br>
                <span>👥 Leiding: ${gekozenNamen.join(', ') || "<i>Niemand toegewezen</i>"}</span>
            </div>
        `;
    });

    if (pool.length > 0) {
        overschotDiv.innerHTML = `
            <div class="card" style="background: #e7f3ff;">
                <h3>Nog vrij:</h3>
                <p>${pool.map(l => l.naam).join(', ')}</p>
            </div>`;
    }
}

function resetEvenement() {
    evenementShifts = [];
    document.getElementById('geplande-shifts-lijst').innerHTML = "";
    document.getElementById('rooster-output').innerHTML = "";
    document.getElementById('foutmeldingen').innerHTML = "";
    document.getElementById('overschot-sectie').innerHTML = "";
}

function wisGeheugen() {
    if (confirm("Dit wist alle opgeslagen leiding. Weet je het zeker?")) {
        localStorage.removeItem('mijnLeiding');
        leidingLijst = [];
        toonLeidingLijst();
    }
}