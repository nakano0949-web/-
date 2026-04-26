let currentBlocks = [];
let currentType = "";
let currentP = 0;

// 数学アルゴリズム
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
    if (type === "affine") {
        aff.shift();
        return { blocks: aff, count: p * p };
    }
    return { blocks: proj, count: q };
}

// 野菜入力欄の生成
function generate() {
    const pElem = document.getElementById("pSelect");
    const tElem = document.getElementById("planeType");
    if (!pElem || !tElem) return;

    currentP = Number(pElem.value);
    currentType = tElem.value;
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
            <td><select class="veg-sel"><option value="">${isEn ? '(Family first)' : '（科を選択）'}</option></select></td>
        `;

        const famSel = tr.querySelector(".fam-sel");
        const vegSel = tr.querySelector(".veg-sel");

        famSel.addEventListener("change", () => {
            const fam = famSel.value;
            const veggies = familyToVeg[fam] || [];
            vegSel.innerHTML = veggies.map(v => `<option value="${v}">${v}</option>`).join("") || `<option value="">-</option>`;
            showFamilyInfo(fam);
        });
        tbody.appendChild(tr);
    }
    document.getElementById("setupArea").style.display = "block";
}

// 共通の情報表示
function showFamilyInfo(fam) {
    const box = document.getElementById("familyInfoBox");
    if (!familyInfo[fam]) { box.style.display = "none"; return; }
    const info = familyInfo[fam];
    const isEn = document.documentElement.lang === "en";
    box.innerHTML = isEn 
        ? `<b>【${fam}】</b> ${info.desc} | Soil: ${info.soil}`
        : `<b>【${fam}の情報】</b> ${info.desc} | 土壌: ${info.soil}`;
    box.style.display = "block";
}

// スケジュール計算
function makeSchedule() {
    const isEn = document.documentElement.lang === "en";
    const vegElements = Array.from(document.querySelectorAll(".veg-sel"));
    const famElements = Array.from(document.querySelectorAll(".fam-sel"));
    const vegData = vegElements.map((sel, idx) => ({
        name: sel.value || (isEn ? `Plot ${idx}` : `区画${idx}`),
        family: famElements[idx].value
    }));

    const ul = document.getElementById("rotation");
    ul.innerHTML = "";

    currentBlocks.forEach((block, y) => {
        const li = document.createElement("li");
        const label = isEn ? `Cycle ${y + 1}` : `${y + 1}番目のサイクル`;
        li.textContent = `【${label}】\n` + block.map(id => vegData[id].name).join(" → ");
        ul.appendChild(li);
    });
}
