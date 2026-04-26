let currentBlocks = [];
let currentType = "";
let currentP = 0;

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
    const datan = [0];
    const dataa = [];
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
      const ndata = [array[i + 1]];
      const adata = [];
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
  } else {
    return { blocks: proj, count: q };
  }
}

function generate() {
  currentP = Number(document.getElementById("pSelect").value);
  currentType = document.getElementById("planeType").value;
  const isEn = document.documentElement.lang === "en";
  
  const result = rebuildPlanes(currentP, currentType);
  currentBlocks = result.blocks;

  const tbody = document.getElementById("vegTable").tBodies[0];
  tbody.innerHTML = "";
  
  for (let i = 0; i < result.count; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td><select class="fam-sel"><option value="">${isEn ? 'Select▼' : '選択▼'}</option>${familyCandidates.map(f=>`<option value="${f}">${f}</option>`).join("")}</select></td>
      <td><select class="veg-sel"><option value="">${isEn ? '(Choose Family First)' : '（科を選んでください）'}</option></select></td>
    `;
    const famSel = tr.querySelector(".fam-sel");
    const vegSel = tr.querySelector(".veg-sel");
    famSel.addEventListener("change", () => {
      const fam = famSel.value;
      vegSel.innerHTML = (familyToVeg[fam] || []).map(v=>`<option value="${v}">${v}</option>`).join("") || `<option value="">N/A</option>`;
      showFamilyInfo(fam);
    });
    tbody.appendChild(tr);
  }
  document.getElementById("setupArea").style.display = "block";
  document.getElementById("rotation").innerHTML = "";
}

function showFamilyInfo(fam) {
  const box = document.getElementById("familyInfoBox");
  if (!familyInfo[fam]) { box.style.display = "none"; return; }
  const info = familyInfo[fam];
  const isEn = document.documentElement.lang === "en";
  box.innerHTML = isEn 
    ? `<b>【${fam} Info】</b> Char: ${info.desc} | Soil: ${info.soil} | Compatible: ${info.good.join(", ")}`
    : `<b>【${fam}の情報】</b> 特徴: ${info.desc} | 土壌: ${info.soil} | 相性◎: ${info.good.join(",")}`;
  box.style.display = "block";
}

function makeSchedule() {
  const isEn = document.documentElement.lang === "en";
  const vegElements = Array.from(document.querySelectorAll(".veg-sel"));
  const famElements = Array.from(document.querySelectorAll(".fam-sel"));
  const vegData = vegElements.map((sel, idx) => ({
    name: sel.value || (isEn ? `Veggie ${idx}` : `区画${idx}`),
    family: famElements[idx].value
  }));
  const ul = document.getElementById("rotation");
  ul.innerHTML = "";
  let soilBalances = new Array(currentP * currentP + (currentType === "projective" ? currentP + 1 : 0)).fill(0);

  if (currentType === "affine") {
    for (let c = 0; c < currentP + 1; c++) {
      const start = c * currentP;
      const classBlocks = currentBlocks.slice(start, start + currentP);
      if (classBlocks.length === 0) continue;
      classBlocks.forEach(block => {
        block.forEach(pIdx => {
          const fam = vegData[pIdx].family;
          if (familyStats[fam]) soilBalances[pIdx] += familyStats[fam].n_score;
        });
      });
      const li = document.createElement("li");
      const text = classBlocks.map((b, i) => `  ${isEn ? 'Ridge' : '畝'}${i+1}: ` + b.map(id => vegData[id].name).join(" → ")).join("\n");
      li.textContent = `【${isEn ? 'Year ' : ''}${c+1}${isEn ? '' : '年目'}】\n${text}`;
      ul.appendChild(li);
    }
  } else {
    currentBlocks.forEach((block, y) => {
      block.forEach(pIdx => {
        const fam = vegData[pIdx].family;
        if (familyStats[fam]) soilBalances[pIdx] += familyStats[fam].n_score;
      });
      const li = document.createElement("li");
      li.textContent = `【${isEn ? 'Block/Cycle ' : 'ブロック（年/季節）'}${y+1}】\n` + block.map(id => vegData[id].name).join(" → ");
      ul.appendChild(li);
    });
  }
  displaySoilAnalysis(soilBalances);
}

function displaySoilAnalysis(balances) {
  const isEn = document.documentElement.lang === "en";
  const ul = document.getElementById("rotation");
  const analysisLi = document.createElement("li");
  const totalBalance = balances.reduce((a, b) => a + b, 0);
  const avgBalance = (totalBalance / balances.length).toFixed(1);
  const isSustainable = avgBalance <= 0;

  analysisLi.style.background = isSustainable ? "#e8f5e9" : "#fff3e0";
  analysisLi.style.border = isSustainable ? "2px solid #4caf50" : "2px solid #ff9800";
  
  if (isEn) {
    const statusMsg = isSustainable ? "<span style='color:green;'>✅ Soil Accumulation Mode</span>" : "<span style='color:red;'>⚠️ Soil Depletion Mode</span>";
    analysisLi.innerHTML = `<strong>【Soil Fertility Analysis】</strong><br>Result: ${statusMsg}<br>Avg Balance: <b>${avgBalance}</b><br><p>${avgBalance < 0 ? "💡 Ideal cycle." : "💡 Consider Legumes."}</p>`;
  } else {
    const statusMsg = isSustainable ? "<span style='color:green;'>✅ 地力蓄積型</span>" : "<span style='color:red;'>⚠️ 地力消費型</span>";
    analysisLi.innerHTML = `<strong>【地力収支解析結果】</strong><br>判定: ${statusMsg}<br>平均収支: <b>${avgBalance}</b><br><p>${avgBalance < 0 ? "💡 理想的な循環です。" : "💡 マメ科を増やしてください。"}</p>`;
  }
  ul.prepend(analysisLi);
}
  "バラ科": { desc:"病害虫が多く注意。", soil:"弱酸性", pests:"うどんこ病", rotation:"3年", good:["ヒガンバナ科"], bad:["バラ科"] },
  "シソ科": { desc:"香りで害虫を抑える。", soil:"弱酸性〜中性", pests:"ハダニ", rotation:"1〜2年", good:["ナス科"], bad:["シソ科"] },
  "ヒガンバナ科": { desc:"強い匂いで害虫を避ける。", soil:"弱酸性〜中性", pests:"ネギアブラムシ", rotation:"1〜2年", good:["ほぼ全科"], bad:["ヒガンバナ科"] },
  "ショウガ科": { desc:"湿り気を好む。", soil:"やや湿り気", pests:"センチュウ", rotation:"2〜3年", good:["マメ科"], bad:["ショウガ科"] },
  "サトイモ科": { desc:"湿地を好む。", soil:"湿り気", pests:"ヨトウムシ", rotation:"2〜3年", good:["マメ科"], bad:["サトイモ科"] },
  "ヒルガオ科": { desc:"連作障害は少なめ。", soil:"弱酸性〜中性", pests:"コガネムシ", rotation:"1〜2年", good:["マメ科"], bad:["ヒルガオ科"] },
  "ヤマノイモ科": { desc:"深い土壌を好む。", soil:"中性", pests:"センチュウ", rotation:"3年", good:["マメ科"], bad:["ヤマノイモ科"] },
  "アオイ科": { desc:"暑さに強い。", soil:"弱酸性〜中性", pests:"アブラムシ", rotation:"1〜2年", good:["マメ科"], bad:["アオイ科"] },
  "キジカクシ科": { desc:"多年生で連作の概念が薄い。", soil:"中性", pests:"アザミウマ", rotation:"多年生", good:["ヒガンバナ科"], bad:["特になし"] },
  "アカザ科": { desc:"乾燥に強い。", soil:"弱酸性〜中性", pests:"アブラムシ", rotation:"1〜2年", good:["セリ科"], bad:["アカザ科"] },
  "オモダカ科": { desc:"水田向き。", soil:"湿地", pests:"スクミリンゴガイ", rotation:"2年", good:["イネ科"], bad:["オモダカ科"] },
  "ミカン科": { desc:"果樹で長期栽培。", soil:"弱酸性", pests:"アゲハ幼虫", rotation:"多年生", good:["ヒガンバナ科"], bad:["特になし"] },
  "ブドウ科": { desc:"つる性果樹。", soil:"弱酸性〜中性", pests:"ハダニ", rotation:"多年生", good:["ヒガンバナ科"], bad:["特になし"] }
};

const familyStats = {
  "マメ科": { n_score: -10 },
  "ナス科": { n_score: 15 },
  "アブラナ科": { n_score: 12 },
  "イネ科": { n_score: 5 },
  "ウリ科": { n_score: 10 },
  "ヒガンバナ科": { n_score: 2 },
  "キク科": { n_score: 3 },
  "セリ科": { n_score: 4 },
  "ヒユ科": { n_score: 6 },
  "シソ科": { n_score: 2 },
  "ヒルガオ科": { n_score: 8 },
  "アオイ科": { n_score: 10 }
};

let currentBlocks = [];
let currentType = "";
let currentP = 0;

// --- アルゴリズム ---
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
    const datan = [0];
    const dataa = [];
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
      const ndata = [array[i + 1]];
      const adata = [];
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
  } else {
    return { blocks: proj, count: q };
  }
}

// --- UI制御 ---
function generate() {
  currentP = Number(document.getElementById("pSelect").value);
  currentType = document.getElementById("planeType").value;
  
  const result = rebuildPlanes(currentP, currentType);
  currentBlocks = result.blocks;

  const tbody = document.getElementById("vegTable").tBodies[0];
  tbody.innerHTML = "";
  
  for (let i = 0; i < result.count; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td><select class="fam-sel"><option value="">選択▼</option>${familyCandidates.map(f=>`<option value="${f}">${f}</option>`).join("")}</select></td>
      <td><select class="veg-sel"><option value="">（科を選んでください）</option></select></td>
    `;
    
    const famSel = tr.querySelector(".fam-sel");
    const vegSel = tr.querySelector(".veg-sel");
    
    famSel.addEventListener("change", () => {
      const fam = famSel.value;
      vegSel.innerHTML = (familyToVeg[fam] || []).map(v=>`<option value="${v}">${v}</option>`).join("") || `<option value="">登録なし</option>`;
      showFamilyInfo(fam);
    });
    
    tbody.appendChild(tr);
  }
  document.getElementById("setupArea").style.display = "block";
  document.getElementById("rotation").innerHTML = "";
}

function showFamilyInfo(fam) {
  const box = document.getElementById("familyInfoBox");
  if (!familyInfo[fam]) { box.style.display = "none"; return; }
  const info = familyInfo[fam];
  box.innerHTML = `<b>【${fam}の情報】</b> 特徴: ${info.desc} | 土壌: ${info.soil} | 相性◎: ${info.good.join(",")}`;
  box.style.display = "block";
}

function makeSchedule() {
  const vegElements = Array.from(document.querySelectorAll(".veg-sel"));
  const famElements = Array.from(document.querySelectorAll(".fam-sel"));
  
  const vegData = vegElements.map((sel, idx) => ({
    name: sel.value || `区画${idx}`,
    family: famElements[idx].value
  }));

  const ul = document.getElementById("rotation");
  ul.innerHTML = "";

  let soilBalances = new Array(currentP * currentP + (currentType === "projective" ? currentP + 1 : 0)).fill(0);

  if (currentType === "affine") {
    for (let c = 0; c < currentP + 1; c++) {
      const start = c * currentP;
      const classBlocks = currentBlocks.slice(start, start + currentP);
      if (classBlocks.length === 0) continue;

      classBlocks.forEach(block => {
        block.forEach(pIdx => {
          const fam = vegData[pIdx].family;
          if (familyStats[fam]) soilBalances[pIdx] += familyStats[fam].n_score;
        });
      });

      const li = document.createElement("li");
      const text = classBlocks.map((b, i) => `  畝${i+1}: ` + b.map(id => vegData[id].name).join(" → ")).join("\n");
      li.textContent = `【${c+1}年目】\n${text}`;
      ul.appendChild(li);
    }
  } else {
    currentBlocks.forEach((block, y) => {
      block.forEach(pIdx => {
        const fam = vegData[pIdx].family;
        if (familyStats[fam]) soilBalances[pIdx] += familyStats[fam].n_score;
      });

      const li = document.createElement("li");
      li.textContent = `【${y+1}ブロック（年/季節）】\n` + block.map(id => vegData[id].name).join(" → ");
      ul.appendChild(li);
    });
  }
  displaySoilAnalysis(soilBalances);
}

function displaySoilAnalysis(balances) {
  const ul = document.getElementById("rotation");
  const analysisLi = document.createElement("li");
  
  const totalBalance = balances.reduce((a, b) => a + b, 0);
  const avgBalance = (totalBalance / balances.length).toFixed(1);
  
  const isSustainable = avgBalance <= 0;

  if (isSustainable) {
    analysisLi.style.background = "#e8f5e9";
    analysisLi.style.border = "2px solid #4caf50";
  } else {
    analysisLi.style.background = "#fff3e0";
    analysisLi.style.border = "2px solid #ff9800";
  }
  
  const statusMsg = isSustainable 
    ? `<span style='color:green;'>✅ 地力蓄積型（持続可能）</span>` 
    : `<span style='color:red;'>⚠️ 地力消費型（窒素不足の恐れあり）</span>`;

  analysisLi.innerHTML = `
    <strong>【地力収支解析結果】</strong><br>
    判定: ${statusMsg}<br>
    1サイクル終了時の平均収支: <b>${avgBalance}</b> 
    <small>（マイナスほど土が肥えています）</small><br>
    
    <p style="margin-top:5px; font-size:0.9em;">
      ${avgBalance < -10 ? "💡 土壌エネルギーが過剰です。実をつける重量野菜（ナス等）をさらに追加しても大丈夫です。" : 
        avgBalance < 0 ? "💡 理想的な「自立型」の循環です。外部肥料なしで永続可能です。" : 
        "💡 窒素の「引き出し」が多すぎます。マメ科のブロックを増やす設計を検討してください。"}
    </p>
    <small>※計算根拠: 各区画における全期間の累積負荷係数</small>
  `;
  ul.prepend(analysisLi);
}
