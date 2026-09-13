const STORAGE_KEY = "luoyi-learning-checkin-v1";
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const weekdayTasks = [
  {
    id: "school",
    title: "完成学校安排",
    detail: "写前看一次姿势；需要时妈妈只提示一步"
  },
  {
    id: "reading",
    title: "阅读15分钟",
    detail: "其中2分钟清楚朗读，让一米外的人听清"
  },
  {
    id: "health",
    title: "睡够、动够",
    detail: "保证充足睡眠，也留出户外活动和玩耍时间"
  }
];

const weekendTasks = [
  {
    id: "reading",
    title: "阅读15分钟",
    detail: "其中2分钟读给家人听，声音清楚但不用喊"
  },
  {
    id: "grip",
    title: "握笔姿势5分钟",
    detail: "练姿势和少量笔画，姿势变形就结束"
  },
  {
    id: "health",
    title: "户外活动和休息",
    detail: "动一动、玩一玩，晚上按上学节奏休息"
  }
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return {
        days: saved.days || {},
        notes: saved.notes || {}
      };
    }
  } catch (error) {
    console.warn("无法读取本地记录，将使用空记录。", error);
  }
  return { days: {}, notes: {} };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + distance);
  return result;
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getTasksForDate(date) {
  const day = date.getDay();
  return day === 0 || day === 6 ? weekendTasks : weekdayTasks;
}

function dayRecord(dateKey) {
  if (!state.days[dateKey]) {
    state.days[dateKey] = {};
  }
  return state.days[dateKey];
}

function completedCount(dateKey, date) {
  const record = state.days[dateKey] || {};
  return getTasksForDate(date).filter((task) => Boolean(record[task.id])).length;
}

function renderToday() {
  const tasks = getTasksForDate(today);
  const record = dayRecord(todayKey);
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  document.getElementById("today-date").textContent =
    `${today.getFullYear()}年${formatMonthDay(today)} · ${weekdays[today.getDay()]}`;

  tasks.forEach((task, index) => {
    const label = document.createElement("label");
    label.className = `task-card${record[task.id] ? " is-done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(record[task.id]);
    checkbox.setAttribute("aria-label", `${task.title}，第${index + 1}项`);
    checkbox.addEventListener("change", () => {
      record[task.id] = checkbox.checked;
      saveState();
      renderToday();
      renderWeek();
    });

    const check = document.createElement("span");
    check.className = "task-check";
    check.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "task-copy";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const detail = document.createElement("span");
    detail.className = "task-detail";
    detail.textContent = task.detail;

    copy.append(title, detail);
    label.append(checkbox, check, copy);
    list.appendChild(label);
  });

  const done = completedCount(todayKey, today);
  document.getElementById("done-count").textContent = String(done);
  document.getElementById("progress-fill").style.width = `${(done / 3) * 100}%`;

  const messages = [
    "按自己的节奏来，完成一件就很踏实。",
    "已经完成一件，剩下的慢慢来。",
    "今天的重点快完成了，累了可以先休息。",
    "今天完成了。现在放心去玩、去休息吧。"
  ];
  document.getElementById("today-message").textContent = messages[done];
}

function renderWeek() {
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekGrid = document.getElementById("week-grid");
  weekGrid.innerHTML = "";

  document.getElementById("week-range").textContent =
    `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`;

  let total = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + offset);
    const dateKey = toLocalDateKey(date);
    const count = completedCount(dateKey, date);
    total += count;

    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (dateKey === todayKey) cell.classList.add("is-today");
    if (date > today) cell.classList.add("is-future");
    cell.setAttribute("aria-label", `${formatMonthDay(date)}完成${count}项`);

    const name = document.createElement("span");
    name.className = "day-name";
    name.textContent = weekdays[date.getDay()].replace("周", "");

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(date.getDate());

    const dots = document.createElement("span");
    dots.className = "day-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = `day-dot${index < count ? " is-filled" : ""}`;
      dots.appendChild(dot);
    }

    cell.append(name, number, dots);
    weekGrid.appendChild(cell);
  }

  document.getElementById("week-total").textContent = `已完成 ${total} 项`;
}

function setupWeeklyNotes() {
  const weekKey = toLocalDateKey(startOfWeek(today));
  const saved = state.notes[weekKey] || { good: "", adjust: "" };
  const good = document.getElementById("weekly-good");
  const adjust = document.getElementById("weekly-adjust");
  const status = document.getElementById("save-state");

  good.value = saved.good;
  adjust.value = saved.adjust;

  document.getElementById("save-week").addEventListener("click", () => {
    state.notes[weekKey] = {
      good: good.value.trim(),
      adjust: adjust.value.trim()
    };
    saveState();
    status.textContent = "已保存在本机";
    window.setTimeout(() => {
      status.textContent = "";
    }, 2400);
  });
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayKey = toLocalDateKey(today);
const state = loadState();

renderToday();
renderWeek();
setupWeeklyNotes();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The page remains fully usable when opened over a local-network URL.
    });
  });
}
