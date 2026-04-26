let currentBlocks = [];
let currentType = "";
let currentP = 0;

// 【完全統合データ】ここに日本語・英語すべての設定をまとめました
const DATA = {
    ja: {
        families: ["ナス科", "アブラナ科", "マメ科", "イネ科", "ウリ科", "ヒガンバナ科"],
        veg: {
            "ナス科": ["トマト", "ナス", "ピーマン"],
            "アブラナ科": ["キャベツ", "大根", "ブロッコリー"],
            "マメ科": ["枝豆", "ソラマメ"],
            "イネ科": ["トウモロコシ"],
            "ウリ科": ["キュウリ", "カボチャ"],
            "ヒガンバナ科": ["ネギ", "玉ねぎ"]
        },
        info: {
            "ナス科": "3〜4年空ける / 弱酸性",
            "アブラナ科": "2〜3年空ける / pH6.5以上",
            "マメ科": "窒素固定で土を肥やす"
        }
    },
    en: {
        families: ["Solanaceae", "Brassicaceae", "Fabaceae", "Poaceae", "Cucurbitaceae", "Amaryllidaceae"],
        veg: {
            "Solanaceae": ["Tomato", "Eggplant", "Pepper"],
            "Brassicaceae": ["Cabbage", "Radish", "Broccoli"],
            "Fabaceae": ["Beans", "Peas"],
            "Poaceae": ["Corn"],
            "Cucurbitaceae": ["Cucumber", "Pumpkin"],
            "Amaryllidaceae": ["Onion", "Leek"]
        },
        info: {
            "Solanaceae": "Wait 3-4 years / Neutral soil",
            "Brassicaceae": "Wait 2-3 years / pH 6.5+",
            "Fabaceae": "Nitrogen-fixing / Enriches soil"
        }
    },
    scores: {
        // スコア計算用（日本語・英語どちらが来ても対応）
        "ナス科": 15, "Solanaceae": 15,
        "アブラナ科": 12, "Brassicaceae": 12,
        "マメ科": -10, "Fabaceae": -10,
        "イネ科": 5, "Poaceae": 5,
        "ウリ科": 10, "Cucurbitaceae": 10,
        "ヒガンバナ科": 2, "Amaryllidaceae": 2
    }
};

function rebuildPlanes(p, type) {
    const q = p * p + p + 1;
    const array = Array.from({ length: q }, (_, i) => i);
    const array1 = [];
    for (let i = 1; i <= p; i++) array1[i - 1] = array.filter(v => p * (i + 1) >= v && p * i < v);
    const proj = [], aff = [];
    for (let num = 1; num < q; num += p) {
        const datan = [0], dataa = [];
        for (let h = 0; h < p; h++) { datan[h + 1] = array[num + h]; dataa[h] = array[num + h] - p - 1; }
        proj.push(datan); aff.push(dataa);
    }
    for (let i = 0; i < p; i++) {
        for (let num = 0; num < p; num++) {
            const n = idx => array1[idx][(num + i * idx) % array1[idx].length];
            const a = idx => array1[idx][(num + i * idx) % array1[idx].length] - p - 1;
            const ndata = [array[i + 1]], adata = [];
            for (let h = 0; h < p; h++) { ndata[h + 1] = n(h); adata[h] = a(h); }
            proj.push(ndata); aff.push(adata);
        }
    }
    return (type === "affine") ? { blocks: aff.slice(1), count: p * p } : { blocks: proj, count: q };
}

function generate() {
    currentP = Number(document.getElementById("pSelect").value);
    currentType = document.getElementById("planeType").value;
    const lang = document.documentElement.lang === "en" ? "en" : "ja";
    const result = rebuildPlanes(currentP, currentType);
    currentBlocks = result.blocks;

    const tbody = document.querySelector("#vegTable tbody");
    tbody.innerHTML = "";
    for (let i = 0; i < result.count; i++) {
        const tr = document.createElement("tr");
        const families = DATA[lang].families;
        tr.innerHTML = `
            <td>${i}</td>
            <td><select class="fam-sel"><option value="">${lang==='en'?'Select▼':'選択▼'}</option>${families.map(f=>`<option value="${f}">${f}</option>`).join("")}</select></td>
