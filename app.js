/* 世界计划性格拟合度测试 */
(function () {
  "use strict";
  const DATA = window.PJSK_MBTI;
  const MBTI_Q = DATA.questions.filter(q => q.dim !== "EN9");
  const EN9_Q = DATA.questions.filter(q => q.dim === "EN9");
  const CHARS = DATA.chars;
  const TOTAL = DATA.questions.length;
  const DIMS = [
    { key: "EI", a: "E", b: "I", label: "外向 E ／ 内向 I", aName: "外向", bName: "内向" },
    { key: "SN", a: "S", b: "N", label: "实感 S ／ 直觉 N", aName: "实感", bName: "直觉" },
    { key: "TF", a: "T", b: "F", label: "思考 T ／ 情感 F", aName: "思考", bName: "情感" },
    { key: "JP", a: "J", b: "P", label: "判断 J ／ 感知 P", aName: "判断", bName: "感知" },
  ];
  const EN9_NAMES = {
    1: ["完美型", "追求正确与改善，眼里容不得沙子，也对自己苛刻。"],
    2: ["助人型", "通过被需要来感受爱，习惯先照顾别人再照顾自己。"],
    3: ["成就型", "用成果定义自己，目标感强，讨厌被认为没能力。"],
    4: ["自我型", "渴望独特与深度，情绪浓烈，追求真实的自我表达。"],
    5: ["理智型", "用知识武装自己，观察多于参与，独处时最安心。"],
    6: ["忠诚型", "警觉而可靠，习惯预想最坏情况，对信任的人极忠诚。"],
    7: ["活跃型", "追逐新鲜与快乐，讨厌被束缚，永远有下一个计划。"],
    8: ["领袖型", "直接、强势、护短，讨厌软弱和被控制。"],
    9: ["和平型", "追求内心与关系的平和，容易迁就，常把自己放最后。"],
  };
  const EN9_CENTERS = { gut: [8, 9, 1], heart: [2, 3, 4], head: [5, 6, 7] };

  let answers = {};   // qid -> 1..7
  let idx = 0;

  const $ = id => document.getElementById(id);
  const show = id => { document.querySelectorAll(".card").forEach(c => c.classList.add("hidden")); $(id).classList.remove("hidden"); };

  function renderScale(q) {
    $("part-label").textContent = q.dim === "EN9" ? "第二部分 · 九型人格" : "第一部分 · MBTI";
    $("q-text").textContent = q.text;
    const hintWrap = $("q-hints");
    hintWrap.innerHTML = (q.hints || []).map(h => `<span class="hint">${h}</span>`).join("");
    const row = $("scale-row");
    row.innerHTML = "";
    for (let v = 1; v <= 7; v++) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = v;
      if (answers[q.id] === v) b.classList.add("on");
      b.onclick = () => {
        answers[q.id] = v;
        renderScale(q);
        setTimeout(next, 260);
      };
      row.appendChild(b);
    }
    $("prog-text").textContent = `${idx + 1} / ${TOTAL}`;
    $("prog-fill").style.width = `${((idx + 1) / TOTAL) * 100}%`;
  }

  function next() {
    if (idx < TOTAL - 1) { idx++; renderScale(DATA.questions[idx]); }
    else { results(); }
  }

  function prev() { if (idx > 0) { idx--; renderScale(DATA.questions[idx]); } }

  function score() {
    const dims = {};
    for (const d of DIMS) { dims[d.key] = { a: 0, b: 0 }; }
    const en = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    let answered = 0;
    for (const q of DATA.questions) {
      const v = answers[q.id];
      if (!v) continue;
      answered++;
      if (q.dim === "EN9") { en[q.type] += v; }
      else {
        const d = dims[q.dim];
        if (q.pole === d.a) d.a += v; else d.b += v;
      }
    }
    const mbti = [];
    const prefs = {};
    for (const d of DIMS) {
      const t = dims[d.key].a + dims[d.key].b;
      const pct = t > 0 ? Math.round((dims[d.key].a / t) * 100) : 50;
      prefs[d.key] = pct; // 偏向 a 的程度
      mbti.push({ ...d, pct });
      mbti[mbti.length - 1].letter = pct >= 50 ? d.a : d.b;
    }
    const typeStr = mbti.map(x => x.letter).join("");
    // 九型
    const enSorted = Object.keys(en).map(Number).sort((x, y) => en[y] - en[x]);
    const top = enSorted[0];
    const wing = en[top - 1] >= en[top + 1] ? top - 1 : top + 1;
    const wingOk = wing >= 1 && wing <= 9 ? wing : null;
    const tri = [];
    for (const c of Object.values(EN9_CENTERS)) {
      tri.push(c.slice().sort((x, y) => en[y] - en[x])[0]);
    }
    return { typeStr, mbti, prefs, en, top, wing: wingOk, tri, answered, total: TOTAL };
  }

  function matchPct(prefs, charMbti) {
    const letters = { EI: charMbti[0], SN: charMbti[1], TF: charMbti[2], JP: charMbti[3] };
    const dimLetters = DIMS.map(d => prefs[d.key] >= 50 ? d.a : d.b);
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      const key = DIMS[i].key;
      const p = prefs[key];
      sum += (letters[key] === dimLetters[i]) ? p : (100 - p);
    }
    return Math.round(sum / 4);
  }

  function results() {
    const s = score();
    $("res-title").textContent = `你的类型：${s.typeStr}${s.wing ? ` · 九型 ${s.top}w${s.wing}` : ` · 九型 ${s.top}`}`;
    const bars = $("mbti-bars");
    bars.innerHTML = s.mbti.map(d => `
      <div class="dim-row">
        <div class="dim-head"><b>${d.a} · ${d.aName}</b><span>${d.label}</span><b>${d.bName} · ${d.b}</b></div>
        <div class="dim-bar">
          <div class="dim-a" style="width:${d.pct}%"></div>
          <div class="dim-b" style="width:${100 - d.pct}%"></div>
        </div>
      </div>`).join("");

    const enBlock = $("ennea-block");
    const chips = Object.keys(s.en).map(Number).sort((a, b) => s.en[b] - s.en[a])
      .map(t => `<span class="en-chip${t === s.top ? " top" : ""}">${t}号 ${EN9_NAMES[t][0]} ${s.en[t]}</span>`).join("");
    enBlock.innerHTML = `
      <h3 class="sub">九型人格</h3>
      <div class="ennea-types">${chips}</div>
      <p class="en-note">主型 <b>${s.top}号 ${EN9_NAMES[s.top][0]}</b>：${EN9_NAMES[s.top][1]}<br>
      ${s.wing ? `侧翼：${s.top}w${s.wing}。` : ""}
      三型组合：${s.tri.join(" / ")}（本能 ${s.tri[0]} · 情感 ${s.tri[1]} · 思维 ${s.tri[2]}）</p>`;

    const ranked = CHARS.map(c => ({ c, pct: matchPct(s.prefs, c.mbti) }))
      .sort((a, b) => b.pct - a.pct).slice(0, 5);
    $("top-matches").innerHTML = ranked.map((r, i) => `
      <div class="match">
        <span class="match-rank">${i + 1}</span>
        <div class="avatar" style="background:linear-gradient(135deg, ${r.c.color}, #334)">${r.c.name[0]}</div>
        <div class="match-info">
          <div class="nm">${r.c.name} <span style="color:${r.c.color}">${r.c.mbti}</span></div>
          <div class="un">${r.c.unit}</div>
          <div class="ds">${r.c.summary || ""}</div>
        </div>
        <div class="match-pct">${r.pct}%</div>
      </div>`).join("");

    $("footer-note").textContent = `作答 ${s.answered}/${s.total} 题 · 结果生成于 ${new Date().toLocaleString("zh-CN")}`;
    show("results");
    window._lastResult = s;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildGallery() {
    $("gallery-grid").innerHTML = CHARS.map(c => `
      <div class="gcard">
        <div class="ava" style="background:linear-gradient(135deg, ${c.color}, #334)">${c.name[0]}</div>
        <div class="nm">${c.name}</div>
        <div class="mb">${c.mbti}</div>
        <div class="un">${c.unit}</div>
      </div>`).join("");
  }

  function drawCard(s) {
    const cv = $("export-canvas");
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    ctx.fillStyle = "#0d1120"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(200, 100, 40, 400, 300, 900);
    g.addColorStop(0, "rgba(53,183,232,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7dd8ff"; ctx.font = "bold 26px 'Microsoft YaHei'";
    ctx.fillText("世界计划 · 性格拟合度测试", 60, 80);
    ctx.fillStyle = "#e8ecf5"; ctx.font = "900 64px 'Microsoft YaHei'";
    ctx.fillText(s.typeStr, 60, 180);
    ctx.fillStyle = "#98a3bd"; ctx.font = "bold 34px 'Microsoft YaHei'";
    ctx.fillText(`九型 ${s.top}${s.wing ? "w" + s.wing : ""} · ${s.tri.join(" / ")}`, 60, 240);
    let y = 330;
    for (const d of s.mbti) {
      ctx.fillStyle = "#98a3bd"; ctx.font = "bold 24px 'Microsoft YaHei'";
      ctx.fillText(`${d.a} ${d.aName}`, 60, y + 8);
      ctx.textAlign = "right";
      ctx.fillText(`${d.bName} ${d.b}`, W - 60, y + 8);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, 60, y + 20, W - 120, 22, 11); ctx.fill();
      ctx.fillStyle = "#35b7e8";
      roundRect(ctx, 60, y + 20, (W - 120) * d.pct / 100, 22, 11); ctx.fill();
      y += 66;
    }
    const ranked = CHARS.map(c => ({ c, pct: matchPct(s.prefs, c.mbti) }))
      .sort((a, b) => b.pct - a.pct).slice(0, 3);
    ctx.fillStyle = "#e8ecf5"; ctx.font = "bold 30px 'Microsoft YaHei'";
    ctx.fillText("最像你的角色", 60, y + 10); y += 56;
    for (const r of ranked) {
      ctx.fillStyle = "#fff";
      roundRect(ctx, 60, y, W - 120, 76, 16);
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
      ctx.fillStyle = r.c.color;
      ctx.beginPath(); ctx.arc(118, y + 38, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "900 22px 'Microsoft YaHei'"; ctx.textAlign = "center";
      ctx.fillText(r.c.name[0], 118, y + 47);
      ctx.textAlign = "left";
      ctx.fillStyle = "#e8ecf5"; ctx.font = "bold 28px 'Microsoft YaHei'";
      ctx.fillText(`${r.c.name}`, 160, y + 34);
      ctx.fillStyle = "#98a3bd"; ctx.font = "20px 'Microsoft YaHei'";
      ctx.fillText(r.c.unit, 160, y + 60);
      ctx.fillStyle = "#4fd08a"; ctx.font = "900 30px 'Microsoft YaHei'"; ctx.textAlign = "right";
      ctx.fillText(r.pct + "%", W - 90, y + 46);
      ctx.textAlign = "left";
      y += 92;
    }
    ctx.fillStyle = "#5f6c88"; ctx.font = "20px 'Microsoft YaHei'";
    ctx.fillText("结果仅供娱乐 · 非专业心理测评 · 非官方同人", 60, H - 70);
    return cv;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  const README = `
<h3>测什么</h3>
<li>MBTI 四维倾向（48 题）：外向/内向、实感/直觉、思考/情感、判断/感知</li>
<li>九型人格（27 题）：主型 + 侧翼 + 三型组合</li>
<li>角色拟合：把 MBTI 四维倾向与 26 位世界计划角色比对，给出相似度排名</li>
<h3>注意事项</h3>
<li>请按「真实的自己」作答，而不是「想成为的自己」</li>
<li>1 = 完全不同意，7 = 完全同意；没有对错</li>
<li>全程约 10~15 分钟，可跳过个别题目</li>
<li>结果会保存成图片，请自行保管</li>
<h3>免责声明</h3>
<li>本测试为同人娱乐项目，不是专业心理测评，不构成任何临床、职业或人际建议</li>
<li>角色 MBTI 判型为粉丝观点，不代表官方设定</li>
<li>Project Sekai 及相关角色版权归 SEGA / Colorful Palette / Crypton Future Media 所有</li>
<li>你的作答完全在本地浏览器处理，不会被上传或存储</li>`;

  function init() {
    buildGallery();
    $("start-btn").onclick = () => { answers = {}; idx = 0; renderScale(DATA.questions[0]); show("quiz"); window.scrollTo({ top: 0 }); };
    $("prev-btn").onclick = prev;
    $("skip-btn").onclick = next;
    $("retake-btn").onclick = () => { answers = {}; idx = 0; renderScale(DATA.questions[0]); show("quiz"); };
    $("gallery-btn").onclick = () => { show("gallery"); };
    $("readme-btn").onclick = () => { $("modal-title").textContent = "注意事项与免责声明"; $("modal-body").innerHTML = README; $("modal").classList.remove("hidden"); };
    $("modal-close").onclick = $("modal-backdrop").onclick = () => $("modal").classList.add("hidden");
    $("save-btn").onclick = () => {
      if (!window._lastResult) return;
      const a = document.createElement("a");
      a.download = "PJSK-MBTI-结果.png";
      a.href = drawCard(window._lastResult).toDataURL("image/png");
      a.click();
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
