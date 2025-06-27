// Tabbladen wisselen
const tabButtons = [
    document.getElementById('tab-producten'),
    document.getElementById('tab-dagboek'),
    document.getElementById('tab-overzicht')
];
const tabSections = [
    document.getElementById('producten-section'),
    document.getElementById('dagboek-section'),
    document.getElementById('overzicht-section')
];

function showTab(index) {
    tabSections.forEach((sec, i) => {
        sec.style.display = i === index ? '' : 'none';
        tabButtons[i].classList.toggle('active', i === index);
    });
}
tabButtons.forEach((btn, i) => btn.addEventListener('click', () => showTab(i)));
showTab(0);

// Productenbeheer
const productForm = document.getElementById('product-form');
const productenTabelBody = document.querySelector('#producten-tabel tbody');

function getProducten() {
    return JSON.parse(localStorage.getItem('producten') || '[]');
}
function setProducten(producten) {
    localStorage.setItem('producten', JSON.stringify(producten));
}
function renderProducten() {
    const producten = getProducten();
    productenTabelBody.innerHTML = '';
    producten.forEach((prod, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.naam}</td>
            <td>${prod.kcal}</td>
            <td>${prod.vet}</td>
            <td>${prod.verzadigd}</td>
            <td>${prod.koolhydraten}</td>
            <td>${prod.suiker}</td>
            <td>${prod.eiwit}</td>
            <td><button class="edit-product" data-idx="${idx}" title="Bewerk">✏️</button></td>
            <td><button class="delete-product" data-idx="${idx}" title="Verwijder">✖️</button></td>
        `;
        productenTabelBody.appendChild(tr);
    });
    // Bewerk-knoppen
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = +btn.dataset.idx;
            const prod = getProducten()[idx];
            document.getElementById('product-naam').value = prod.naam;
            document.getElementById('product-kcal').value = prod.kcal;
            document.getElementById('product-vet').value = prod.vet;
            document.getElementById('product-verzadigd').value = prod.verzadigd;
            document.getElementById('product-koolhydraten').value = prod.koolhydraten;
            document.getElementById('product-suiker').value = prod.suiker;
            document.getElementById('product-eiwit').value = prod.eiwit;
            productForm.dataset.editIdx = idx;
        });
    });
    // Verwijder-knoppen
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!confirm('Bent u zeker dat u het wilt verwijderen?')) return;
            const idx = +btn.dataset.idx;
            let producten = getProducten();
            producten.splice(idx, 1);
            setProducten(producten);
            updateProductenUI();
        });
    });
}
productForm.addEventListener('submit', e => {
    e.preventDefault();
    function parseNum(val) {
        return +String(val).replace(',', '.');
    }
    const prod = {
        naam: document.getElementById('product-naam').value.trim(),
        kcal: parseNum(document.getElementById('product-kcal').value),
        vet: parseNum(document.getElementById('product-vet').value),
        verzadigd: parseNum(document.getElementById('product-verzadigd').value),
        koolhydraten: parseNum(document.getElementById('product-koolhydraten').value),
        suiker: parseNum(document.getElementById('product-suiker').value),
        eiwit: parseNum(document.getElementById('product-eiwit').value)
    };
    if (!prod.naam) {
        alert('Vul een productnaam in.');
        return;
    }
    for (const key of ['kcal','vet','verzadigd','koolhydraten','suiker','eiwit']) {
        const val = document.getElementById('product-' + key).value;
        if (val === '' || isNaN(prod[key])) {
            alert('Vul een geldig getal in voor ' + key + '.');
            return;
        }
    }
    let producten = getProducten();
    if (productForm.dataset.editIdx !== undefined) {
        // Bewerken
        producten[+productForm.dataset.editIdx] = prod;
        delete productForm.dataset.editIdx;
    } else {
        producten.push(prod);
    }
    setProducten(producten);
    renderProducten();
    productForm.reset();
});
renderProducten();

// Dagboek
const dagboekForm = document.getElementById('dagboek-form');
const dagboekTabelBody = document.querySelector('#dagboek-tabel tbody');
const zoekInput = document.getElementById('dagboek-product-zoek');
const suggestiesDiv = document.getElementById('suggesties');
const gramInput = document.getElementById('dagboek-gram');
const productenDatalist = document.getElementById('producten-datalist');

// --- Dagboek dag-navigatie ---
const dagboekDatumLabel = document.getElementById('dagboek-datum');
const dagboekPrevBtn = document.getElementById('dagboek-prevdag');
const dagboekNextBtn = document.getElementById('dagboek-nextdag');

function formatDateLabel(date) {
    const dagen = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
    const maanden = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    return `${dagen[date.getDay()]} ${date.getDate()} ${maanden[date.getMonth()]} ${date.getFullYear()}`;
}

function getTodayDateStr() {
    const d = new Date();
    return d.toISOString().slice(0,10);
}
let geselecteerdeDag = getTodayDateStr();

function setDagboekDatumLabel() {
    const d = new Date(geselecteerdeDag);
    dagboekDatumLabel.textContent = formatDateLabel(d);
}

dagboekPrevBtn.addEventListener('click', () => {
    const d = new Date(geselecteerdeDag);
    d.setDate(d.getDate() - 1);
    geselecteerdeDag = d.toISOString().slice(0,10);
    setDagboekDatumLabel();
    renderDagboek();
});
dagboekNextBtn.addEventListener('click', () => {
    const d = new Date(geselecteerdeDag);
    d.setDate(d.getDate() + 1);
    geselecteerdeDag = d.toISOString().slice(0,10);
    setDagboekDatumLabel();
    renderDagboek();
});

function getDagboek() {
    return JSON.parse(localStorage.getItem('dagboek') || '[]');
}
function setDagboek(dagboek) {
    localStorage.setItem('dagboek', JSON.stringify(dagboek));
}

function vulProductenDatalist() {
    const producten = getProducten();
    productenDatalist.innerHTML = producten.map(p => `<option value="${p.naam}"></option>`).join('');
}
vulProductenDatalist();

function updateProductenUI() {
    renderProducten();
    vulProductenDatalist();
}

// --- Dagboek bewerken/verwijderen ---
let bewerkIndex = null;

function berekenTotaal(items) {
    return items.reduce((acc, item) => {
        acc.kcal += Number(item.kcal);
        acc.vet += Number(item.vet);
        acc.verzadigd += Number(item.verzadigd);
        acc.koolhydraten += Number(item.koolhydraten);
        acc.suiker += Number(item.suiker);
        acc.eiwit += Number(item.eiwit);
        return acc;
    }, {kcal:0, vet:0, verzadigd:0, koolhydraten:0, suiker:0, eiwit:0});
}

function renderMomentenTotaalTabel() {
    const dagboek = getDagboek().filter(item => (item.datum || getTodayDateStr()) === geselecteerdeDag);
    const momenten = [
        'Voor training',
        'Na training',
        'Ontbijt',
        'Lunch',
        'Tussendoor',
        'Diner'
    ];
    const limieten = {
        kcal: 1600,
        vet: 59,
        koolhydraten: 150,
        eiwit: 120,
        suiker: 30,
        verzadigd: 15
    };
    const rows = [];
    momenten.forEach(moment => {
        const items = dagboek.filter(item => item.moment === moment);
        const totaal = berekenTotaal(items);
        rows.push({
            moment,
            ...totaal
        });
    });
    // Totaal van alles
    const totaal = berekenTotaal(dagboek);
    rows.push({
        moment: 'Totaal',
        ...totaal
    });
    const tbody = document.querySelector('#momenten-totaal-tabel tbody');
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.moment}</td>
            <td${r.kcal > limieten.kcal ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.kcal.toFixed(1)}</td>
            <td${r.vet > limieten.vet ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.vet.toFixed(1)}</td>
            <td${r.koolhydraten > limieten.koolhydraten ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.koolhydraten.toFixed(1)}</td>
            <td${r.eiwit > limieten.eiwit ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.eiwit.toFixed(1)}</td>
            <td${r.suiker > limieten.suiker ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.suiker.toFixed(1)}</td>
            <td${r.verzadigd > limieten.verzadigd ? ' style="color:#c62828;font-weight:bold;"' : ''}>${r.verzadigd.toFixed(1)}</td>
        </tr>
    `).join('');
}

function renderDagboek() {
    setDagboekDatumLabel();
    const dagboek = getDagboek().filter(item => (item.datum || getTodayDateStr()) === geselecteerdeDag);
    dagboekTabelBody.innerHTML = '';
    dagboek.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.moment || ''}</td>
            <td>${item.naam}</td>
            <td>${item.gram}</td>
            <td>${item.kcal}</td>
            <td>${item.vet}</td>
            <td>${item.verzadigd}</td>
            <td>${item.koolhydraten}</td>
            <td>${item.suiker}</td>
            <td>${item.eiwit}</td>
            <td><button class="edit-dagboek" data-idx="${idx}" title="Bewerk">✏️</button></td>
            <td><button class="delete-dagboek" data-idx="${idx}" title="Verwijder">✖️</button></td>
        `;
        dagboekTabelBody.appendChild(tr);
    });
    // Bewerk
    document.querySelectorAll('.edit-dagboek').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = +btn.dataset.idx;
            const item = getDagboek().filter(item => (item.datum || getTodayDateStr()) === geselecteerdeDag)[idx];
            zoekInput.value = item.naam;
            gramInput.value = item.gram;
            document.getElementById('dagboek-moment').value = item.moment || '';
            bewerkIndex = idx;
        });
    });
    // Verwijder
    document.querySelectorAll('.delete-dagboek').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Bent u zeker dat u het wilt verwijderen?')) return;
            const idx = +btn.dataset.idx;
            let dagboek = getDagboek();
            // Filter op geselecteerde dag
            const dagboekVanDag = dagboek.filter(item => (item.datum || getTodayDateStr()) === geselecteerdeDag);
            const itemToDelete = dagboekVanDag[idx];
            // Verwijder uit alle data
            dagboek = dagboek.filter(item => item !== itemToDelete);
            setDagboek(dagboek);
            renderDagboek();
            renderOverzicht();
        });
    });
    renderMomentenTotaalTabel();
}

// --- Dagboek toevoegen/bewerken ---
dagboekForm.addEventListener('submit', e => {
    e.preventDefault();
    function parseNum(val) {
        return +String(val).replace(',', '.');
    }
    const naam = zoekInput.value.trim();
    const producten = getProducten();
    const prod = producten.find(p => p.naam.toLowerCase() === naam.toLowerCase());
    const gram = parseNum(gramInput.value);
    const moment = document.getElementById('dagboek-moment').value;
    if (!naam || !gram || !prod || !moment) return;
    const item = {
        naam,
        gram,
        kcal: +(prod.kcal * gram / 100).toFixed(1),
        vet: +(prod.vet * gram / 100).toFixed(1),
        verzadigd: +(prod.verzadigd * gram / 100).toFixed(1),
        koolhydraten: +(prod.koolhydraten * gram / 100).toFixed(1),
        suiker: +(prod.suiker * gram / 100).toFixed(1),
        eiwit: +(prod.eiwit * gram / 100).toFixed(1),
        moment,
        datum: geselecteerdeDag
    };
    let dagboek = getDagboek();
    if (bewerkIndex !== null) {
        // Filter op geselecteerde dag
        const dagboekVanDag = dagboek.filter(item => (item.datum || getTodayDateStr()) === geselecteerdeDag);
        const itemToEdit = dagboekVanDag[bewerkIndex];
        const idxInAll = dagboek.indexOf(itemToEdit);
        dagboek[idxInAll] = item;
        bewerkIndex = null;
    } else {
        dagboek.push(item);
    }
    setDagboek(dagboek);
    renderDagboek();
    dagboekForm.reset();
});

// --- Productenlijst bijwerken na toevoegen/bewerken product ---
productForm.addEventListener('submit', updateProductenUI);

// --- Init ---
setDagboekDatumLabel();
renderDagboek();

// Overzicht & Pie charts
const behoefte = {
    kcal: 1600,
    eiwit: 120,
    vet: 59,
    koolhydraten: 150,
    suiker: 30, // nu limiet opgegeven
    verzadigd: 15 // nu limiet opgegeven
};

let charts = {};
function renderOverzicht() {
    setOverzichtDatumLabel();
    const dagboek = getDagboek().filter(item => (item.datum || getTodayDateStr()) === geselecteerdeOverzichtDag);
    const totals = dagboek.reduce((acc, item) => {
        acc.kcal += Number(item.kcal);
        acc.vet += Number(item.vet);
        acc.verzadigd += Number(item.verzadigd);
        acc.koolhydraten += Number(item.koolhydraten);
        acc.suiker += Number(item.suiker);
        acc.eiwit += Number(item.eiwit);
        return acc;
    }, {kcal:0, vet:0, verzadigd:0, koolhydraten:0, suiker:0, eiwit:0});
    // Pie charts
    const chartData = [
        {id:'chart-kcal', label:'Kcal', value:totals.kcal, max:behoefte.kcal, limiet:behoefte.kcal},
        {id:'chart-vet', label:'Vet (g)', value:totals.vet, max:behoefte.vet, limiet:behoefte.vet},
        {id:'chart-verzadigd', label:'Verzadigd vet (g)', value:totals.verzadigd, max:behoefte.verzadigd, limiet:behoefte.verzadigd},
        {id:'chart-kh', label:'Koolhydraten (g)', value:totals.koolhydraten, max:150, limiet:150},
        {id:'chart-suiker', label:'Suiker (g)', value:totals.suiker, max:behoefte.suiker, limiet:behoefte.suiker},
        {id:'chart-eiwit', label:'Eiwit (g)', value:totals.eiwit, max:behoefte.eiwit, limiet:behoefte.eiwit}
    ];
    chartData.forEach(data => {
        const ctx = document.getElementById(data.id).getContext('2d');
        if (charts[data.id]) charts[data.id].destroy();
        // label met gegeten/behoefte
        const mainLabel = `${data.label} (${data.value.toFixed(1)}/${data.max})`;
        // kleur rood als limiet overschreden
        let kleur = data.value > data.limiet ? '#c62828' : null;
        let gradient = null;
        if (!kleur && data.value === 0) {
            kleur = '#0E1011'; // gewenste kleur voor 0
        } else if (!kleur) {
            gradient = ctx.createLinearGradient(0, 0, 120, 120);
            gradient.addColorStop(0, '#8A4674');
            gradient.addColorStop(0.5, '#D26A78');
            gradient.addColorStop(1, '#E48478');
            kleur = gradient;
        }
        charts[data.id] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [mainLabel],
                datasets: [{
                    data: [Math.max(data.value, 0.0001)], // altijd een cirkel
                    backgroundColor: [kleur],
                    borderColor: '#606672',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#606672',
                            font: { weight: '500', size: 14 },
                            filter: (legendItem, data) => legendItem.text !== 'Resterend'
                        }
                    }
                },
                responsive: false
            }
        });
    });
}
// Herteken overzicht als je naar tabblad gaat
 tabButtons[2].addEventListener('click', () => {
    geselecteerdeOverzichtDag = getTodayDateStr();
    setOverzichtDatumLabel();
    renderOverzicht();
 });
// Ook na toevoegen aan dagboek
 dagboekForm.addEventListener('submit', renderOverzicht); 

// --- Suggesties bij typen (werkt alleen als zoekInput zichtbaar is) ---
zoekInput.addEventListener('input', () => {
    if (zoekInput.style.display === 'none') return;
    const val = zoekInput.value.trim().toLowerCase();
    if (!val) {
        suggestiesDiv.style.display = 'none';
        return;
    }
    const producten = getProducten();
    const matches = producten.filter(p => p.naam.toLowerCase().includes(val));
    if (matches.length === 0) {
        suggestiesDiv.style.display = 'none';
        return;
    }
    suggestiesDiv.innerHTML = '';
    matches.forEach((p, i) => {
        const div = document.createElement('div');
        div.textContent = p.naam;
        div.addEventListener('click', () => {
            zoekInput.value = p.naam;
            suggestiesDiv.style.display = 'none';
        });
        suggestiesDiv.appendChild(div);
    });
    suggestiesDiv.style.display = 'block';
});

document.addEventListener('click', e => {
    if (!suggestiesDiv.contains(e.target) && e.target !== zoekInput) {
        suggestiesDiv.style.display = 'none';
    }
});

// --- Overzicht dag-navigatie ---
const overzichtDatumLabel = document.getElementById('overzicht-datum');
const overzichtPrevBtn = document.getElementById('overzicht-prevdag');
const overzichtNextBtn = document.getElementById('overzicht-nextdag');

let geselecteerdeOverzichtDag = getTodayDateStr();

function setOverzichtDatumLabel() {
    const d = new Date(geselecteerdeOverzichtDag);
    overzichtDatumLabel.textContent = formatDateLabel(d);
}

overzichtPrevBtn.addEventListener('click', () => {
    const d = new Date(geselecteerdeOverzichtDag);
    d.setDate(d.getDate() - 1);
    geselecteerdeOverzichtDag = d.toISOString().slice(0,10);
    setOverzichtDatumLabel();
    renderOverzicht();
});
overzichtNextBtn.addEventListener('click', () => {
    const d = new Date(geselecteerdeOverzichtDag);
    d.setDate(d.getDate() + 1);
    geselecteerdeOverzichtDag = d.toISOString().slice(0,10);
    setOverzichtDatumLabel();
    renderOverzicht();
}); 