/* 점심 운동 앱 — 화면 코드. 루틴 데이터는 data.js에 있습니다. */
(function () {
  "use strict";

  const D = window.DATA;
  const KEY = {
    records: "lw.records",
    settings: "lw.settings",
    gear: "lw.gear",
    todos: "lw.todos",
    draft: "lw.draft."
  };
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const view = document.getElementById("view");

  /* ---------- 저장소 ---------- */
  function load(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast("저장 공간에 쓸 수 없습니다"); return false; }
  }

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function ymd(d) {
    const p = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function parseYmd(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function dateLabel(s) {
    const d = parseYmd(s);
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일(" + DAY_NAMES[d.getDay()] + ")";
  }
  function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
  function fmtSec(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function parsePace(str) {
    if (!str) return null;
    str = String(str).trim();
    let m = str.match(/^(\d{1,2})[:'분.\s](\d{1,2})/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    m = str.match(/^\d+$/);
    if (m) return Number(str);
    return null;
  }
  function num(v) {
    const n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : null;
  }
  function round05(n) { return Math.round(n * 2) / 2; }
  function today() { return ymd(new Date()); }

  /* ---------- 주차·루틴 계산 ---------- */
  function settings() { return load(KEY.settings, { startDate: "" }); }

  function weekOf(dateStr) {
    const s = settings().startDate;
    if (!s) return { week: 1, set: false };
    const diff = Math.floor((parseYmd(dateStr) - parseYmd(s)) / 86400000);
    if (diff < 0) return { week: 1, set: true, before: true };
    return { week: Math.floor(diff / 7) % D.cycleWeeks + 1, set: true, cycle: Math.floor(diff / 7 / D.cycleWeeks) + 1 };
  }
  function weekInfo(n) { return D.weeks.find(w => w.week === n) || D.weeks[0]; }

  function adjustExercise(ex, wk) {
    let sets = ex.sets;
    if (wk.setDelta) sets = Math.max(1, sets + wk.setDelta);
    if (wk.volumeFactor) sets = Math.max(1, Math.round(sets * wk.volumeFactor));
    return Object.assign({}, ex, {
      sets,
      rpe: ex.rpe ? (wk.rpe || ex.rpe) : null,
      setsChanged: sets !== ex.sets,
      rpeChanged: !!ex.rpe && !!wk.rpe && wk.rpe !== ex.rpe
    });
  }
  function adjustBlock(b, wk) {
    let reps = b.reps;
    if (b.main && wk.swimPct && wk.swimPct !== 100) reps = Math.max(1, Math.round(b.reps * wk.swimPct / 100));
    return Object.assign({}, b, { reps, repsChanged: reps !== b.reps });
  }
  function blockDist(b) { return b.reps * b.dist; }
  function blockText(b) { return b.reps > 1 ? b.reps + "×" + b.dist + "m" : b.dist + "m"; }

  /* ---------- 유튜브 영상 검색 링크 ---------- */
  function videoUrl(item) {
    const q = item.video || (item.name + " " + (D.videoSuffix || "")).trim();
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  }
  function videoLink(item) {
    return '<a class="yt" href="' + esc(videoUrl(item)) + '" target="_blank" rel="noopener" aria-label="' +
      esc(item.name) + ' 유튜브 영상 검색">' + esc(item.name) + '<span class="yt-ico" aria-hidden="true">▶</span></a>';
  }

  /* ---------- 기록 ---------- */
  function records() { return load(KEY.records, []); }
  function lastWeight(exId, beforeDate) {
    const list = records().filter(r => r.date < beforeDate && r.exercises)
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const r of list) {
      const e = r.exercises.find(x => x.id === exId && x.weight != null);
      if (e) return { weight: e.weight, date: r.date };
    }
    return null;
  }
  function lastCss(beforeDate) {
    const list = records().filter(r => r.date < beforeDate && r.swim && r.swim.css)
      .sort((a, b) => b.date.localeCompare(a.date));
    return list[0] ? list[0].swim.css : null;
  }

  /* ---------- 오늘 초안(진행 상태) ---------- */
  // "W"(웨이트) 날은 rotation 순서대로 돌아가며 배정. 기준일부터 지나간 W 날 수로 순서를 정합니다.
  function resolveKey(dateStr) {
    const k = D.schedule[parseYmd(dateStr).getDay()];
    if (k !== "W") return k || "rest";
    const rot = D.rotation || [];
    if (!rot.length) return "rest";
    const ref = settings().startDate || D.rotationStart || "2026-01-05";
    const from = dateStr < ref ? dateStr : ref;
    const to = dateStr < ref ? ref : dateStr;
    let n = 0;
    for (let d = parseYmd(from); ymd(d) < to; d.setDate(d.getDate() + 1)) {
      if (D.schedule[d.getDay()] === "W") n++;
    }
    if (dateStr < ref) n = -n;
    return rot[((n % rot.length) + rot.length) % rot.length];
  }
  function defaultKey(dateStr) { return resolveKey(dateStr); }
  function mondayOf(dateStr) {
    const d = parseYmd(dateStr);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  // 예상 소요 시간(분): 워밍업 + 세트마다 (동작 + 휴식) + 운동 사이 이동
  function estimateMin(exercises) {
    const sec = exercises.reduce((s, ex) => s + ex.sets * ((ex.work || D.setWorkSec || 45) + ex.rest), 0);
    return Math.round((D.warmupMin || 0) + sec / 60 + (D.changeMin || 0) * exercises.length);
  }

  function getDraft(dateStr) {
    const d = load(KEY.draft + dateStr, null);
    // 루틴 키가 바뀌어 없어진 경우(예: 예전 A/B/C) 오늘 기본 루틴으로 되돌림
    if (d && d.key !== "rest" && !D.workouts[d.key]) d.key = defaultKey(dateStr);
    if (d) return d;
    return { key: defaultKey(dateStr), sets: {}, weight: {}, rpe: {}, blocks: {}, css: "" };
  }
  function putDraft(dateStr, d) { save(KEY.draft + dateStr, d); }
  function cleanOldDrafts() {
    try {
      const cutoff = ymd(new Date(Date.now() - 14 * 86400000));
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(KEY.draft) && k.slice(KEY.draft.length) < cutoff) localStorage.removeItem(k);
      }
    } catch (e) { /* 무시 */ }
  }

  /* ---------- 상태 ---------- */
  const state = {
    tab: "today",
    weekSel: null,
    chartEx: null,
    date: today()
  };

  /* ---------- 오늘 탭 ---------- */
  function timelineHtml(type) {
    const items = D.timeline[type];
    const now = new Date();
    const isToday = state.date === ymd(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let status = "";
    let nowIdx = -1, nextIdx = -1;
    if (isToday) {
      nowIdx = items.findIndex(s => nowMin >= toMin(s.start) && nowMin < toMin(s.end));
      if (nowIdx < 0) nextIdx = items.findIndex(s => toMin(s.start) > nowMin);
      if (nowIdx >= 0) {
        const s = items[nowIdx];
        status = "지금: " + s.label + " · " + (toMin(s.end) - nowMin) + "분 남음";
      } else if (nextIdx >= 0) {
        const s = items[nextIdx];
        const left = toMin(s.start) - nowMin;
        status = "다음: " + s.label + " · " + (left >= 60 ? Math.floor(left / 60) + "시간 " + (left % 60) + "분" : left + "분") + " 후";
      } else {
        status = "오늘 점심 운동 시간이 끝났습니다";
      }
    }
    const lis = items.map((s, i) => {
      let cls = "";
      if (isToday) {
        if (i === nowIdx) cls = "now";
        else if (i === nextIdx) cls = "next";
        else if (nowMin >= toMin(s.end)) cls = "past";
      }
      return '<li class="' + cls + '"><span class="t">' + esc(s.start) + "~" + esc(s.end) + "</span>" +
        '<span><strong>' + esc(s.label) + "</strong>" + (s.detail ? ' <span class="muted small">' + esc(s.detail) + "</span>" : "") + "</span></li>";
    }).join("");
    return '<ul class="timeline">' + lis + "</ul>" + (status ? '<p class="tl-status">' + esc(status) + "</p>" : "");
  }

  function switcherHtml(key) {
    const opts = Object.keys(D.workouts).map(k =>
      '<option value="' + k + '"' + (k === key ? " selected" : "") + ">" + esc(D.workouts[k].name) + "</option>").join("");
    return '<label class="muted small" style="display:block;margin-top:10px">다른 루틴으로 바꾸기' +
      '<select data-act="switch">' + opts + '<option value="rest"' + (key === "rest" ? " selected" : "") + ">휴식</option></select></label>";
  }

  function renderToday() {
    const date = state.date;
    const wInfo = weekOf(date);
    const wk = weekInfo(wInfo.week);
    const draft = getDraft(date);
    const key = draft.key;
    const workout = D.workouts[key];
    const doneRec = records().find(r => r.date === date);

    let html = '<header><p class="muted">' + esc(dateLabel(date)) + "</p>" +
      '<div class="row between"><h1>' + esc(workout ? workout.name : "휴식") + "</h1>" +
      '<span class="pill">' + wInfo.week + "주차 · " + esc(wk.label) + "</span></div>" +
      (workout ? '<p class="muted">' + esc(workout.focus) + "</p>" : "") +
      "</header>";

    if (!wInfo.set) {
      html += '<div class="card"><p><span class="pill warn">시작일 미설정</span></p><p class="small">정보 탭에서 프로그램 시작일을 정하면 주차가 자동으로 계산됩니다. 지금은 1주차로 표시합니다.</p>' +
        '<button type="button" class="btn" data-act="tab" data-tab="info">시작일 정하기</button></div>';
    }
    if (doneRec) {
      html += '<div class="card done"><span class="pill ok">완료</span> <span class="small">' +
        esc(new Date(doneRec.completedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })) +
        "에 저장했습니다. 고친 뒤 다시 저장하면 덮어씁니다.</span></div>";
    }

    if (!workout) {
      html += '<div class="card"><h3>오늘은 휴식</h3><p class="muted small">가벼운 걷기와 스트레칭으로 회복하세요. 이번 주 초점: ' + esc(wk.note) + "</p>" +
        switcherHtml(key) + "</div>";
      view.innerHTML = html;
      return;
    }

    html += '<h2>점심 타임라인</h2><div class="card" id="tl">' + timelineHtml(workout.type) + "</div>";
    html += '<div class="card"><p class="small"><strong>' + wInfo.week + "주차:</strong> " + esc(wk.note) + "</p></div>";

    if (workout.type === "weight") {
      const exs = workout.exercises.map(e => adjustExercise(e, wk));
      html += '<h2>운동 · 예상 약 ' + estimateMin(exs) + "분</h2>";
      exs.forEach(ex => {
        const sets = draft.sets[ex.id] || [];
        const last = ex.load ? lastWeight(ex.id, date) : null;
        let hint = "";
        if (last && wk.loadIncrease) {
          const lo = round05(last.weight * (1 + wk.loadIncrease[0] / 100));
          const hi = round05(last.weight * (1 + wk.loadIncrease[1] / 100));
          hint = "지난 기록 " + last.weight + "kg → 이번 주 " + lo + "~" + hi + "kg 권장";
        } else if (last) {
          hint = "지난 기록 " + last.weight + "kg (" + dateLabel(last.date) + ")";
        }
        let setBtns = "";
        for (let i = 0; i < ex.sets; i++) {
          setBtns += '<button type="button" class="set" data-act="set" data-ex="' + ex.id + '" data-i="' + i + '" data-rest="' + ex.rest +
            '" aria-pressed="' + (sets[i] ? "true" : "false") + '" aria-label="' + (i + 1) + '세트">' + (i + 1) + "</button>";
        }
        html += '<section class="card" data-name="' + esc(ex.name) + '">' +
          '<h3>' + videoLink(ex) + "</h3>" +
          '<div class="ex-meta"><span class="pill' + (ex.setsChanged ? " warn" : "") + '">' + ex.sets + "×" + esc(ex.reps) + (ex.unit ? " " + esc(ex.unit) : "") + "</span>" +
          (ex.rpe ? '<span class="pill' + (ex.rpeChanged ? " warn" : "") + '">RPE ' + esc(ex.rpe) + "</span>" : "") +
          '<span class="pill">휴식 ' + fmtSec(ex.rest) + "</span>" +
          (ex.target ? '<span class="pill ok">' + esc(ex.target) + "</span>" : "") + "</div>" +
          '<p class="cue">' + esc(ex.cue) + "</p>" +
          '<div class="sets">' + setBtns + "</div>" +
          '<div class="inputs">' +
          (ex.load ? '<label>중량(kg)<input type="text" inputmode="decimal" data-field="weight" data-ex="' + ex.id + '" value="' + esc(draft.weight[ex.id] || "") + '" placeholder="' + (last ? last.weight : "kg") + '"></label>' : "") +
          (ex.rpe ? '<label>실제 RPE<input type="text" inputmode="decimal" data-field="rpe" data-ex="' + ex.id + '" value="' + esc(draft.rpe[ex.id] || "") + '" placeholder="' + esc(ex.rpe) + '"></label>' : "") +
          '<button type="button" class="btn" data-act="rest" data-rest="' + ex.rest + '" data-label="' + esc(ex.name) + '">⏱ 휴식</button>' +
          "</div>" +
          (hint ? '<p class="hint">' + esc(hint) + "</p>" : "") +
          "</section>";
      });
    } else {
      const blocks = workout.blocks.map(b => adjustBlock(b, wk));
      const total = blocks.reduce((s, b) => s + blockDist(b), 0);
      const prevCss = lastCss(date);
      let cssHint = "";
      if (prevCss && wk.cssDelta) cssHint = "지난 CSS " + fmtSec(prevCss) + " → 이번 주 목표 " + fmtSec(prevCss + wk.cssDelta) + "/100m";
      else if (prevCss) cssHint = "지난 CSS " + fmtSec(prevCss) + "/100m";
      html += '<h2>세션 · 총 ' + total.toLocaleString() + "m" + (wk.swimFocus ? " · " + esc(wk.swimFocus) : "") + "</h2>";
      if (workout.note) html += '<div class="card"><p class="small">' + esc(workout.note) + "</p></div>";
      html += '<div class="card">' + blocks.map(b => {
        const on = !!draft.blocks[b.id];
        return '<div class="block' + (b.main ? " main" : "") + '">' +
          '<button type="button" class="check" data-act="block" data-block="' + b.id + '" data-rest="' + b.rest + '" aria-pressed="' + on + '" aria-label="' + esc(b.name) + ' 완료">✓</button>' +
          '<div class="grow"><div class="row between"><h3>' + videoLink(b) + "</h3>" +
          '<span class="pill' + (b.repsChanged ? " warn" : "") + '">' + blockText(b) + "</span></div>" +
          '<p class="small muted">' + esc(b.detail) + (b.rest ? " · 휴식 " + b.rest + "초" : "") + "</p>" +
          (b.css ? '<div class="inputs" style="margin-top:8px"><label>이번 CSS 페이스(분:초/100m)<input type="text" inputmode="numeric" data-field="css" value="' + esc(draft.css || "") + '" placeholder="' + (prevCss ? fmtSec(prevCss) : "1:45") + '"></label></div>' +
            (cssHint ? '<p class="hint">' + esc(cssHint) + "</p>" : "") : "") +
          (b.rest >= 20 ? '<button type="button" class="btn" style="margin-top:8px" data-act="rest" data-rest="' + b.rest + '" data-label="' + esc(b.name) + '">⏱ ' + b.rest + "초</button>" : "") +
          "</div></div>";
      }).join("") + "</div>";
      if (workout.type === "swim" && !workout.blocks.some(b => b.css)) {
        html += '<div class="card"><label class="muted small">CSS 페이스를 쟀다면 입력(선택)<input type="text" inputmode="numeric" data-field="css" value="' + esc(draft.css || "") + '" placeholder="1:45"></label></div>';
      }
    }

    html += '<button type="button" class="btn primary block" data-act="complete">' + (doneRec ? "기록 다시 저장" : "운동 완료") + "</button>";
    html += switcherHtml(key);
    view.innerHTML = html;
  }

  function completeToday() {
    const date = state.date;
    const draft = getDraft(date);
    const workout = D.workouts[draft.key];
    if (!workout) return;
    const wInfo = weekOf(date);
    const wk = weekInfo(wInfo.week);
    const rec = {
      date, key: draft.key, name: workout.name, type: workout.type,
      week: wInfo.week, completedAt: new Date().toISOString()
    };
    if (workout.type === "weight") {
      rec.exercises = workout.exercises.map(e => adjustExercise(e, wk)).map(ex => {
        const sets = draft.sets[ex.id] || [];
        return {
          id: ex.id, name: ex.name,
          weight: num(draft.weight[ex.id]),
          rpe: num(draft.rpe[ex.id]),
          done: sets.filter(Boolean).length, total: ex.sets
        };
      });
    } else {
      const blocks = workout.blocks.map(b => adjustBlock(b, wk));
      const done = blocks.filter(b => draft.blocks[b.id]);
      rec.swim = {
        css: parsePace(draft.css),
        distance: done.reduce((s, b) => s + blockDist(b), 0),
        planned: blocks.reduce((s, b) => s + blockDist(b), 0),
        blocksDone: done.length, blocksTotal: blocks.length
      };
      if (draft.css && rec.swim.css == null) { toast("CSS 페이스는 1:45처럼 입력하세요"); return; }
    }
    const list = records().filter(r => r.date !== date);
    list.push(rec);
    list.sort((a, b) => a.date.localeCompare(b.date));
    if (save(KEY.records, list)) {
      toast("오늘 기록을 저장했습니다");
      stopTimer();
      renderToday();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /* ---------- 주간 계획 탭 ---------- */
  function renderWeek() {
    const cur = weekOf(today());
    const sel = state.weekSel || cur.week;
    const wk = weekInfo(sel);
    const todayDow = new Date().getDay();
    let html = "<h1>주간 계획</h1>" +
      '<p class="muted small">' + (cur.set ? "이번 주는 " + cur.week + "주차입니다" + (cur.cycle > 1 ? " (" + cur.cycle + "번째 주기)" : "") : "시작일을 정하지 않아 1주차로 표시합니다") + "</p>" +
      '<div class="seg" role="group" aria-label="주차 선택">' +
      D.weeks.map(w => '<button type="button" data-act="week" data-w="' + w.week + '" aria-pressed="' + (w.week === sel) + '">' + w.week + "주" +
        (w.week === cur.week ? '<span class="cur">이번 주</span>' : "") + "</button>").join("") + "</div>" +
      '<div class="card"><div class="row between"><h3>' + sel + "주차 · " + esc(wk.label) + '</h3><span class="pill">RPE ' + esc(wk.rpe) + "</span></div>" +
      '<p class="small">' + esc(wk.note) + '</p><p class="muted small"><span class="changed">주황색</span>은 기본 루틴에서 바뀐 값입니다.</p></div>';

    // 앞쪽·뒤쪽 교대: 이번 주와 다음 주 배치
    const mon = mondayOf(today());
    const rotLine = base => [1, 2, 3, 4, 5].filter(dow => D.schedule[dow] === "W").map(dow => {
      const w = D.workouts[resolveKey(ymd(addDays(base, dow - 1)))];
      return DAY_NAMES[dow] + " " + (w ? w.name.replace("웨이트 ", "") : "휴식");
    }).join(" · ");
    if (Object.values(D.schedule).includes("W")) {
      html += '<div class="card"><p class="small"><strong>웨이트 교대</strong> 이번 주 ' + esc(rotLine(mon)) +
        '</p><p class="muted small">다음 주 ' + esc(rotLine(addDays(mon, 7))) + "</p></div>";
    }

    [1, 2, 3, 4, 5].forEach(dow => {
      const key = resolveKey(ymd(addDays(mon, dow - 1)));
      const w = D.workouts[key];
      if (!w) return;
      html += '<section class="card"><div class="row between"><h3>' + DAY_NAMES[dow] + " · " + esc(w.name) +
        (dow === todayDow ? ' <span class="today-badge small">오늘</span>' : "") + '</h3></div><p class="muted small">' + esc(w.focus) + '</p><ul class="plan-list">';
      if (w.type === "weight") {
        const exs = w.exercises.map(e => adjustExercise(e, wk));
        exs.forEach(ex => {
          html += "<li><span>" + videoLink(ex) + (ex.target ? ' <span class="muted small">' + esc(ex.target) + "</span>" : "") + '</span><span class="v">' +
            '<span class="' + (ex.setsChanged ? "changed" : "") + '">' + ex.sets + "</span>×" + esc(ex.reps) +
            (ex.rpe ? ' · <span class="' + (ex.rpeChanged ? "changed" : "") + '">RPE ' + esc(ex.rpe) + "</span>" : "") + "</span></li>";
        });
        if (wk.loadIncrease) html += '<li><span class="changed">중량 +' + wk.loadIncrease[0] + "~" + wk.loadIncrease[1] + "%</span><span></span></li>";
        html += '<li><strong>예상 소요</strong><span class="v"><strong>약 ' + estimateMin(exs) + "분</strong></span></li>";
      } else {
        const blocks = w.blocks.map(b => adjustBlock(b, wk));
        blocks.forEach(b => {
          html += "<li><span>" + videoLink(b) + '</span><span class="v ' + (b.repsChanged ? "changed" : "") + '">' + blockText(b) + "</span></li>";
        });
        const total = blocks.reduce((s, b) => s + blockDist(b), 0);
        html += "<li><strong>합계</strong><span class=\"v\"><strong>" + total.toLocaleString() + "m</strong>" +
          (wk.cssDelta && blocks.some(b => b.css) ? ' · <span class="changed">CSS ' + wk.cssDelta + "초</span>" : "") +
          (wk.swimFocus ? ' · <span class="changed">' + esc(wk.swimFocus) + "</span>" : "") + "</span></li>";
      }
      html += "</ul></section>";
    });
    view.innerHTML = html;
  }

  /* ---------- 기록 탭 ---------- */
  function lineChart(points, opts) {
    const W = 340, H = 190, L = 44, R = 14, T = 16, B = 30;
    if (points.length === 0) return '<p class="empty">아직 기록이 없습니다</p>';
    const ys = points.map(p => p.y);
    let min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
    if (min === max) { min -= 1; max += 1; }
    const padY = (max - min) * 0.15;
    min -= padY; max += padY;
    const x = i => points.length === 1 ? (L + (W - L - R) / 2) : L + i * (W - L - R) / (points.length - 1);
    const y = v => T + (max - v) / (max - min) * (H - T - B);
    const fmt = opts.fmt || (v => String(Math.round(v * 10) / 10));
    let g = "";
    for (let k = 0; k <= 3; k++) {
      const v = min + (max - min) * k / 3;
      const yy = y(v);
      g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/>' +
        '<text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + esc(fmt(v)) + "</text>";
    }
    const path = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.y).toFixed(1)).join(" ");
    const step = Math.ceil(points.length / 5);
    let dots = "";
    points.forEach((p, i) => {
      dots += '<circle class="dot" cx="' + x(i) + '" cy="' + y(p.y) + '" r="4"><title>' + esc(p.label + " · " + fmt(p.y)) + "</title></circle>";
      if (i % step === 0 || i === points.length - 1) {
        dots += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(p.short) + "</text>";
      }
    });
    const lastP = points[points.length - 1];
    dots += '<text class="val" x="' + x(points.length - 1) + '" y="' + (y(lastP.y) - 10) + '" text-anchor="' + (points.length > 1 ? "end" : "middle") + '">' + esc(fmt(lastP.y) + (opts.unit || "")) + "</text>";
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.title) + '">' + g +
      (points.length > 1 ? '<path class="line" d="' + path + '"/>' : "") + dots + "</svg>";
  }
  function shortDate(s) { const d = parseYmd(s); return (d.getMonth() + 1) + "/" + d.getDate(); }

  function renderLog() {
    const recs = records();
    const loadEx = [];
    Object.keys(D.workouts).forEach(k => (D.workouts[k].exercises || []).forEach(e => { if (e.load) loadEx.push(e); }));
    // data.js에서 빠진 운동도 기록이 있으면 선택지에 남김
    recs.forEach(r => (r.exercises || []).forEach(e => {
      if (e.weight != null && !loadEx.some(x => x.id === e.id)) loadEx.push({ id: e.id, name: e.name });
    }));
    if (!state.chartEx || !loadEx.some(e => e.id === state.chartEx)) {
      const withData = loadEx.find(e => recs.some(r => (r.exercises || []).some(x => x.id === e.id && x.weight != null)));
      state.chartEx = (withData || loadEx[0] || {}).id;
    }
    const pts = recs.filter(r => r.exercises).map(r => {
      const e = r.exercises.find(x => x.id === state.chartEx && x.weight != null);
      return e ? { y: e.weight, label: dateLabel(r.date), short: shortDate(r.date) } : null;
    }).filter(Boolean);
    const cssPts = recs.filter(r => r.swim && r.swim.css).map(r => ({ y: r.swim.css, label: dateLabel(r.date) + " " + r.name, short: shortDate(r.date) }));

    let html = "<h1>기록</h1>";
    html += '<h2>중량 추이</h2><div class="card"><select data-act="chart-ex" aria-label="운동 선택">' +
      loadEx.map(e => '<option value="' + e.id + '"' + (e.id === state.chartEx ? " selected" : "") + ">" + esc(e.name) + "</option>").join("") +
      "</select>" + lineChart(pts, { unit: "kg", title: "중량 추이" }) + "</div>";

    html += '<h2>수영 CSS 페이스</h2><div class="card"><p class="muted small">100m당 시간. 낮을수록 빠릅니다.</p>' +
      lineChart(cssPts, { fmt: fmtSec, unit: "", title: "CSS 페이스 추이" });
    if (cssPts.length) {
      const best = Math.min.apply(null, cssPts.map(p => p.y));
      html += '<p class="small">최고 기록 <strong>' + fmtSec(best) + "</strong>/100m · 총 " + cssPts.length + "회</p>";
    }
    html += "</div>";

    html += '<h2>완료 내역 <span class="muted small">' + recs.length + "회</span></h2>";
    if (!recs.length) html += '<div class="card empty">오늘 탭에서 “운동 완료”를 누르면 여기에 쌓입니다</div>';
    recs.slice().reverse().forEach(r => {
      let detail = "";
      let summary = "";
      if (r.exercises) {
        const done = r.exercises.reduce((s, e) => s + e.done, 0);
        const total = r.exercises.reduce((s, e) => s + e.total, 0);
        summary = done + "/" + total + "세트";
        detail = r.exercises.map(e => "<li>" + esc(e.name) + " · " + e.done + "/" + e.total + "세트" +
          (e.weight != null ? " · " + e.weight + "kg" : "") + (e.rpe != null ? " · RPE " + e.rpe : "") + "</li>").join("");
      } else if (r.swim) {
        summary = r.swim.distance.toLocaleString() + "m";
        detail = "<li>완료 " + r.swim.blocksDone + "/" + r.swim.blocksTotal + "블록 · " + r.swim.distance.toLocaleString() + "/" + r.swim.planned.toLocaleString() + "m</li>" +
          (r.swim.css ? "<li>CSS " + fmtSec(r.swim.css) + "/100m</li>" : "");
      }
      html += '<details class="card log-item"><summary><span><strong>' + esc(dateLabel(r.date)) + "</strong> " + esc(r.name) +
        ' <span class="muted small">' + r.week + '주차</span></span><span class="pill ok">' + esc(summary) + "</span></summary>" +
        "<ul>" + detail + '</ul><button type="button" class="btn danger" style="margin-top:10px" data-act="del-rec" data-date="' + r.date + '">이 기록 삭제</button></details>';
    });
    view.innerHTML = html;
  }

  /* ---------- 정보 탭 ---------- */
  function checklistHtml(items, stored, kind) {
    return '<ul class="checklist">' + items.map((t, i) =>
      '<li><label><input type="checkbox" data-act="check" data-kind="' + kind + '" data-i="' + i + '"' + (stored[t] ? " checked" : "") + "><span>" + esc(t) + "</span></label></li>").join("") + "</ul>";
  }
  function renderInfo() {
    const s = settings();
    const cur = weekOf(today());
    const f = D.facility;
    const gear = load(KEY.gear, {});
    const todos = load(KEY.todos, {});
    const mapUrl = "https://map.naver.com/p/search/" + encodeURIComponent(f.address);
    let html = "<h1>정보</h1>";
    html += '<h2>프로그램 시작일</h2><div class="card"><label class="muted small">시작일(이날부터 1주차, 4주 주기 반복)' +
      '<input type="date" data-act="start" value="' + esc(s.startDate) + '"></label>' +
      '<p class="small" style="margin-top:8px">' + (s.startDate ? (cur.before ? "아직 시작 전입니다" : "오늘은 " + cur.week + "주차" + (cur.cycle > 1 ? " · " + cur.cycle + "번째 주기" : "")) : "시작일을 정하지 않으면 1주차로 표시합니다") + "</p></div>";

    html += '<h2>시설</h2><div class="card"><h3>' + esc(f.name) + '</h3><p class="muted small">' + esc(f.address) + " · " + esc(f.hours) + "</p>" +
      '<ul class="small" style="padding-left:18px;margin:8px 0">' + f.info.map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
      '<div class="btn-row"><a class="btn primary tel" href="tel:' + esc(f.tel.replace(/[^0-9+]/g, "")) + '">☎ ' + esc(f.tel) + "</a>" +
      '<a class="btn tel" href="' + mapUrl + '" target="_blank" rel="noopener">지도</a></div></div>';

    const todoDone = D.todos.filter(t => todos[t]).length;
    html += '<h2>확인할 일 <span class="muted small">' + todoDone + "/" + D.todos.length + "</span></h2><div class=\"card\">" + checklistHtml(D.todos, todos, "todos") + "</div>";
    const gearDone = D.gear.filter(t => gear[t]).length;
    html += '<h2>준비물 <span class="muted small">' + gearDone + "/" + D.gear.length + '</span></h2><div class="card">' + checklistHtml(D.gear, gear, "gear") +
      '<button type="button" class="btn ghost" style="margin-top:8px" data-act="gear-reset">준비물 체크 모두 해제</button></div>';

    html += '<h2>백업</h2><div class="card"><p class="muted small">기록·설정·체크 상태를 JSON 파일로 저장하고, 다른 기기에서 불러올 수 있습니다.</p>' +
      '<div class="btn-row"><button type="button" class="btn" data-act="export">내보내기</button>' +
      '<button type="button" class="btn" data-act="import">가져오기</button></div>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
      '<button type="button" class="btn danger" style="margin-top:8px;width:100%" data-act="reset">모든 데이터 지우기</button></div>';
    html += '<p class="muted small" style="text-align:center;margin-top:20px">데이터는 이 기기의 브라우저에만 저장됩니다.</p>';
    view.innerHTML = html;
    document.getElementById("importFile").addEventListener("change", onImportFile);
  }

  /* ---------- 백업 ---------- */
  function exportData() {
    const payload = {
      app: "lunch-workout", version: 1, exportedAt: new Date().toISOString(),
      records: records(), settings: settings(), gear: load(KEY.gear, {}), todos: load(KEY.todos, {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lunch-workout-backup-" + today() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("백업 파일을 만들었습니다");
  }
  function validRecord(r) {
    return r && typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && typeof r.name === "string" &&
      (Array.isArray(r.exercises) || (r.swim && typeof r.swim === "object"));
  }
  function importData(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { toast("JSON 파일을 읽을 수 없습니다"); return false; }
    if (!obj || obj.app !== "lunch-workout" || !Array.isArray(obj.records)) { toast("이 앱의 백업 파일이 아닙니다"); return false; }
    const recs = obj.records.filter(validRecord);
    if (!confirm("백업의 기록 " + recs.length + "건으로 현재 데이터를 바꿉니다. 계속할까요?")) return false;
    save(KEY.records, recs.sort((a, b) => a.date.localeCompare(b.date)));
    if (obj.settings && typeof obj.settings === "object") save(KEY.settings, { startDate: /^\d{4}-\d{2}-\d{2}$/.test(obj.settings.startDate || "") ? obj.settings.startDate : "" });
    if (obj.gear && typeof obj.gear === "object") save(KEY.gear, obj.gear);
    if (obj.todos && typeof obj.todos === "object") save(KEY.todos, obj.todos);
    toast("기록 " + recs.length + "건을 가져왔습니다");
    render();
    return true;
  }
  function onImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importData(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  }

  /* ---------- 휴식 타이머 ---------- */
  const tEl = {
    box: document.getElementById("timer"),
    label: document.getElementById("timerLabel"),
    time: document.getElementById("timerTime"),
    fill: document.getElementById("timerFill")
  };
  const timer = { end: 0, total: 0, iv: null, finished: false, hideT: null };
  let audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }
  function beep() {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((d, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.22);
    });
  }
  function startTimer(sec, label) {
    ensureAudio();
    clearTimeout(timer.hideT);
    timer.end = Date.now() + sec * 1000;
    timer.total = sec;
    timer.finished = false;
    tEl.label.textContent = "휴식 · " + label;
    tEl.box.classList.remove("finished");
    tEl.box.hidden = false;
    clearInterval(timer.iv);
    timer.iv = setInterval(tick, 250);
    tick();
  }
  function tick() {
    const rem = (timer.end - Date.now()) / 1000;
    if (rem <= 0) {
      tEl.time.textContent = "0:00";
      tEl.fill.style.width = "0%";
      if (!timer.finished) finishTimer();
      return;
    }
    tEl.time.textContent = fmtSec(Math.ceil(rem));
    tEl.fill.style.width = (rem / timer.total * 100).toFixed(1) + "%";
  }
  function finishTimer() {
    timer.finished = true;
    clearInterval(timer.iv);
    tEl.box.classList.add("finished");
    tEl.label.textContent = "휴식 끝! 다음 세트";
    try { if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 500]); } catch (e) { /* 무시 */ }
    beep();
    timer.hideT = setTimeout(stopTimer, 10000);
  }
  function stopTimer() {
    clearInterval(timer.iv);
    clearTimeout(timer.hideT);
    tEl.box.hidden = true;
  }
  function addTimer(sec) {
    if (timer.finished) { startTimer(sec, "추가"); return; }
    timer.end += sec * 1000;
    timer.total += sec;
    tick();
  }

  /* ---------- 공통 ---------- */
  let toastT = null;
  function toast(msg, ms) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.hidden = true; }, ms || 2200);
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tabbar button").forEach(b => {
      if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    state.date = today();
    ({ today: renderToday, week: renderWeek, log: renderLog, info: renderInfo }[state.tab] || renderToday)();
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act], .tabbar button");
    if (!el) return;
    const act = el.dataset.act || "tab";
    const date = state.date;
    switch (act) {
      case "tab": setTab(el.dataset.tab); break;
      case "set": {
        const d = getDraft(date);
        const arr = d.sets[el.dataset.ex] || [];
        const i = Number(el.dataset.i);
        arr[i] = !arr[i];
        d.sets[el.dataset.ex] = arr;
        putDraft(date, d);
        el.setAttribute("aria-pressed", String(!!arr[i]));
        if (arr[i]) {
          const card = el.closest("section");
          startTimer(Number(el.dataset.rest), card ? card.dataset.name || "" : "");
        }
        break;
      }
      case "block": {
        const d = getDraft(date);
        const id = el.dataset.block;
        d.blocks[id] = !d.blocks[id];
        putDraft(date, d);
        el.setAttribute("aria-pressed", String(d.blocks[id]));
        break;
      }
      case "rest": startTimer(Number(el.dataset.rest), el.dataset.label || ""); break;
      case "complete": completeToday(); break;
      case "timer-add": addTimer(40); break;
      case "timer-stop": stopTimer(); break;
      case "week": state.weekSel = Number(el.dataset.w); renderWeek(); break;
      case "del-rec":
        if (confirm(dateLabel(el.dataset.date) + " 기록을 삭제할까요?")) {
          save(KEY.records, records().filter(r => r.date !== el.dataset.date));
          toast("기록을 삭제했습니다");
          renderLog();
        }
        break;
      case "gear-reset": save(KEY.gear, {}); renderInfo(); break;
      case "export": exportData(); break;
      case "import": document.getElementById("importFile").click(); break;
      case "reset":
        if (confirm("기록·설정·체크 상태를 모두 지웁니다. 먼저 백업을 내보내는 것을 권장합니다. 계속할까요?")) {
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && k.startsWith("lw.")) localStorage.removeItem(k);
            }
          } catch (err) { /* 무시 */ }
          toast("모든 데이터를 지웠습니다");
          render();
        }
        break;
    }
  });

  document.addEventListener("change", e => {
    const el = e.target;
    const act = el.dataset.act;
    if (act === "switch") {
      const d = getDraft(state.date);
      d.key = el.value;
      putDraft(state.date, d);
      renderToday();
    } else if (act === "chart-ex") {
      state.chartEx = el.value;
      renderLog();
    } else if (act === "start") {
      const s = settings();
      s.startDate = el.value || "";
      save(KEY.settings, s);
      toast(s.startDate ? "시작일을 " + dateLabel(s.startDate) + "로 정했습니다" : "시작일을 지웠습니다");
      state.weekSel = null;
      renderInfo();
    } else if (act === "check") {
      const kind = el.dataset.kind;
      const items = kind === "gear" ? D.gear : D.todos;
      const k = kind === "gear" ? KEY.gear : KEY.todos;
      const stored = load(k, {});
      stored[items[Number(el.dataset.i)]] = el.checked;
      save(k, stored);
      const h = el.closest(".card").previousElementSibling;
      const span = h && h.querySelector(".muted");
      if (span) span.textContent = items.filter(t => stored[t]).length + "/" + items.length;
    }
  });

  document.addEventListener("input", e => {
    const el = e.target;
    const field = el.dataset.field;
    if (!field) return;
    const d = getDraft(state.date);
    if (field === "css") d.css = el.value;
    else d[field][el.dataset.ex] = el.value;
    putDraft(state.date, d);
  });

  // 타임라인 강조와 날짜 변경을 주기적으로 반영
  setInterval(() => {
    if (state.tab !== "today") return;
    if (state.date !== today()) { render(); return; }
    const tl = document.getElementById("tl");
    const w = D.workouts[getDraft(state.date).key];
    if (tl && w) tl.innerHTML = timelineHtml(w.type);
  }, 30000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.tab === "today") {
      const active = document.activeElement;
      if (!active || !active.dataset || !active.dataset.field) render();
    }
  });

  /* ---------- 시작 ---------- */
  cleanOldDrafts();
  const initial = location.hash.slice(1);
  setTab(["today", "week", "log", "info"].includes(initial) ? initial : "today");

  /* ---------- 새 버전 자동 반영 ---------- */
  // 새 서비스 워커가 페이지를 넘겨받으면(controllerchange) 새로고침해 새 버전을 보여 줍니다.
  // 입력 중이거나 휴식 타이머가 도는 중이면 끝날 때까지 미룹니다.
  try {
    if (sessionStorage.getItem("lw.updated")) {
      sessionStorage.removeItem("lw.updated");
      setTimeout(() => toast("새 버전으로 업데이트했습니다", 4000), 300);
    }
  } catch (e) { /* 무시 */ }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const hadController = !!navigator.serviceWorker.controller;
    let pendingReload = false;
    let reg = null;
    const busy = () => {
      const a = document.activeElement;
      const typing = !!(a && a.dataset && a.dataset.field);
      const timing = !tEl.box.hidden && !timer.finished;
      return typing || timing;
    };
    const tryReload = () => {
      if (!pendingReload || busy()) return;
      pendingReload = false;
      try { sessionStorage.setItem("lw.updated", "1"); } catch (e) { /* 무시 */ }
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) return; // 처음 설치할 때는 새로고침할 필요 없음
      pendingReload = true;
      if (busy()) toast("새 버전이 준비됐습니다. 휴식이 끝나면 반영됩니다", 4000);
      tryReload();
    });
    setInterval(tryReload, 3000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && reg) reg.update().catch(() => { /* 오프라인 */ });
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js")
        .then(r => { reg = r; })
        .catch(() => { /* 오프라인 미지원 환경 */ });
    });
  }

  // 테스트·디버깅용
  window.__lw = { importData, exportData, records };
})();
