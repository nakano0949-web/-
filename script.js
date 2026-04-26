let currentBlocks = [];
let currentType = "";
let currentP = 0;

// 【全言語共通】地力スコアデータ
const commonFamilyStats = {
    "ナス科": { n_score: 15 }, "Solanaceae": { n_score: 15 },
    "アブラナ科": { n_score: 12 }, "Brassicaceae": { n_score: 12 },
    "マメ科": { n_score: -10 }, "Fabaceae": { n_score: -10 },
    "イネ科": { n_score: 5 }, "Poaceae": { n_score: 5 },
    "ウリ科": { n_score: 10 }, "Cucurbitaceae": { n_score: 10 },
    "ヒガンバナ科": { n_score: 2 }, "Amaryllidaceae": { n_score: 2 },
    "キク科": { n_score: 3 }, "Asteraceae": { n_score: 3 },
    "セリ科": { n_score: 4 }, "Apiaceae": { n_score: 4 },
    "ヒユ科": { n_score: 6 }, "Amaranthaceae": { n_score: 6 }
};

function rebuildPlanes(p, type) {
    const q = p * p + p + 1;
    const array = Array.from({ length: q }, (_, i) => i);
    const array1 = [];
    for (let i = 1; i <= p; i++) {
        array1[i - 1] = array.filter(v => p * (i + 1) >= v && p * i < v);
    }
    const proj = [];
    const aff = [];
    for (let num = 1; num < q; num += p) {
        const datan = [0], dataa = [];
        for (let h = 0; h < p; h++) {
            datan[h + 1] = array[num + h];
            dataa[h] = array[num + h] - p - 1;
        }
        proj.push(datan);
        aff.push(dataa);
    }
    for (let i = 0; i < p; i++) {
        for (let num = 0; num < p; num++) {
            const n = idx => array1[idx][(num + i * idx) % array1[idx].length];
            const a = idx => array1[idx][(num + i * idx) % array1[idx].length] - p - 1;
            const ndata = [array[i + 1]], adata = [];
            for (let h = 0; h < p; h++) {
                ndata[h + 1] = n(h);
                adata[h] = a(h);
            }
            proj.push(ndata);
            aff.push(adata);
        }
    }
    return (type === "affine") ? { blocks: aff.slice(1), count: p * p } : { blocks: proj, count: q };
}

function generate() {
    currentP = Number(document.getElementById("pSelect").value);
    currentType = document.getElementById("planeType").value;
    const isEn = document.documentElement.lang === "en";
    const result = rebuildPlanes(currentP, currentType);
    currentBlocks = result.blocks;

    const tbody = document.querySelector("#vegTable tbody");
    tbody.innerHTML = "";
    for (let i = 0; i < result.count; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i}</td>
            <td><select class="fam-sel"><option value="">${isEn ? 'Select▼' : '選択▼'}</option>${familyCandidates.map(f => `<option value="${f}">${f}</option>`).join("")}</select></td>
            <td><select class="veg-sel"><option value="">${isEn ? '(Wait)' : '（科を選択）'}</option></select></td>
        `;
        const fSel = tr.querySelector(".fam-sel"), vSel = tr.querySelector(".veg-sel");
        fSel.onchange = () => {
            const list = familyToVeg[fSel.value] || [];
            vSel.innerHTML = list.map(v => `<option value="${v}">${v}</option>`).join("") || `<option value="">-</option>`;
            showFamilyInfo(fSel.value);
        };
        tbody.appendChild(tr);
    }
    document.getElementById("setupArea").style.display = "block";
    document.getElementById("rotation").innerHTML = "";
}

function showFamilyInfo(fam) {
    const box = document.getElementById("familyInfoBox");
    if (!familyInfo[fam]) { box.style.display = "none"; return; }
    const isEn = document.documentElement.lang === "en";
    box.innerHTML = `<b>【${fam}】</b> ${familyInfo[fam].desc} | ${isEn ? 'Soil':'土'}: ${familyInfo[fam].soil}`;
    box.style.display = "block";
}

function makeSchedule() {
    const isEn = document.documentElement.lang === "en";
    const vegElements = Array.from(document.querySelectorAll(".veg-sel"));
    const famElements = Array.from(document.querySelectorAll(".fam-sel"));
    const vegData = vegElements.map((sel, i) => ({ name: sel.value || (isEn?`P${i}`:`区画${i}`), family: famElements[i].value }));

    const ul = document.getElementById("rotation");
    ul.innerHTML = "";
    let balances = new Array(vegData.length).fill(0);

    currentBlocks.forEach((block, y) => {
        block.forEach(pIdx => {
            const score = commonFamilyStats[vegData[pIdx].family]?.n_score || 0;
            balances[pIdx] += score;
        });
        const li = document.createElement("li");
        li.textContent = `【${isEn?'Cycle':'サイクル'} ${y+1}】\n` + block.map(id => vegData[id].name).join(" → ");
        ul.appendChild(li);
    });

    displayAnalysis(balances, isEn);
}

function displayAnalysis(balances, isEn) {
    const ul = document.getElementById("rotation");
    const avg = (balances.reduce((a, b) => a + b, 0) / balances.length).toFixed(1);
    const ok = avg <= 0;
    const li = document.createElement("li");
    li.style.background = ok ? "#e8f5e9" : "#fff3e0";
    li.style.border = `2px solid ${ok ? '#4caf50' : '#ff9800'}`;
    li.innerHTML = `<strong>${isEn?'Analysis':'解析結果'}</strong>: ${ok ? '✅ Sustainable' : '⚠️ Depleting'}<br>
    Avg: ${avg} (Target: <0)<br>${avg < 0 ? '💡 Good!' : '💡 Need Legumes!'}`;
    ul.prepend(li);
}
