const rounds = [
  {
    rule: "颜色按红、蓝交替。",
    sequence: [{ shape: "circle", color: "coral" }, { shape: "circle", color: "blue" }, { shape: "circle", color: "coral" }, { shape: "circle", color: "blue" }, null, { shape: "circle", color: "blue" }],
    options: [{ shape: "circle", color: "coral" }, { shape: "circle", color: "green" }, { shape: "circle", color: "blue" }],
    answer: 0,
    hint: "先只看颜色：红、蓝、红、蓝，下一块应该是什么颜色？"
  },
  {
    rule: "形状按圆形、三角形交替。",
    sequence: [{ shape: "circle", color: "green" }, { shape: "triangle", color: "gold" }, { shape: "circle", color: "green" }, { shape: "triangle", color: "gold" }, null, { shape: "triangle", color: "gold" }],
    options: [{ shape: "square", color: "green" }, { shape: "circle", color: "green" }, { shape: "triangle", color: "gold" }],
    answer: 1,
    hint: "把颜色先放到一边，看看形状是不是一圆一三角。"
  },
  {
    rule: "大小按小、中、大循环。",
    sequence: [{ shape: "diamond", color: "blue", size: "small" }, { shape: "diamond", color: "blue", size: "medium" }, { shape: "diamond", color: "blue", size: "large" }, { shape: "diamond", color: "blue", size: "small" }, { shape: "diamond", color: "blue", size: "medium" }, null],
    options: [{ shape: "diamond", color: "blue", size: "medium" }, { shape: "diamond", color: "blue", size: "large" }, { shape: "diamond", color: "blue", size: "small" }],
    answer: 1,
    hint: "比一比大小：小、中、大，然后又从小开始。"
  },
  {
    rule: "数量按1个、2个、3个循环。",
    sequence: [{ shape: "dot", color: "coral", count: 1 }, { shape: "dot", color: "coral", count: 2 }, { shape: "dot", color: "coral", count: 3 }, { shape: "dot", color: "coral", count: 1 }, { shape: "dot", color: "coral", count: 2 }, null],
    options: [{ shape: "dot", color: "coral", count: 2 }, { shape: "dot", color: "coral", count: 3 }, { shape: "dot", color: "coral", count: 1 }],
    answer: 1,
    hint: "数一数每格有几个小圆点：1、2、3，接下来轮到几？"
  },
  {
    rule: "颜色按绿、黄、红循环。",
    sequence: [{ shape: "leaf", color: "green" }, { shape: "leaf", color: "gold" }, { shape: "leaf", color: "coral" }, { shape: "leaf", color: "green" }, { shape: "leaf", color: "gold" }, null],
    options: [{ shape: "leaf", color: "blue" }, { shape: "leaf", color: "gold" }, { shape: "leaf", color: "coral" }],
    answer: 2,
    hint: "把三个颜色连起来看：绿、黄、红，又从绿开始。"
  },
  {
    rule: "形状按圆形、方形、三角形循环。",
    sequence: [{ shape: "circle", color: "blue" }, { shape: "square", color: "blue" }, { shape: "triangle", color: "blue" }, { shape: "circle", color: "blue" }, { shape: "square", color: "blue" }, null],
    options: [{ shape: "circle", color: "blue" }, { shape: "triangle", color: "blue" }, { shape: "square", color: "blue" }],
    answer: 1,
    hint: "数三个一组：圆、方、三角；圆、方，下一块是什么？"
  }
];

let roundIndex = 0;
let answered = false;
const sequenceEl = document.getElementById("sequence");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const nextButton = document.getElementById("next-round");
const finishPanel = document.getElementById("finish-panel");

function pieceMarkup(piece) {
  if (piece.shape === "dot") {
    const dots = Array.from({ length: piece.count }, () => '<span class="piece-dot"></span>').join("");
    return `<span class="piece"><span class="piece-dots piece-color--${piece.color}">${dots}</span></span>`;
  }
  const sizeClass = piece.size ? ` piece-shape--${piece.size}` : "";
  return `<span class="piece"><span class="piece-shape piece-shape--${piece.shape} piece-color--${piece.color}${sizeClass}"></span></span>`;
}

function renderRound() {
  const round = rounds[roundIndex];
  answered = false;
  document.getElementById("round-kicker").textContent = `第${roundIndex + 1}关`;
  document.getElementById("round-number").textContent = String(roundIndex + 1);
  document.getElementById("round-fill").style.width = `${((roundIndex + 1) / rounds.length) * 100}%`;
  sequenceEl.innerHTML = round.sequence.map((piece) => piece
    ? `<div class="sequence-card">${pieceMarkup(piece)}</div>`
    : '<div class="sequence-card is-missing" aria-label="缺少一块图形"><span class="question-mark" aria-hidden="true">?</span></div>'
  ).join("");
  optionsEl.innerHTML = "";
  round.options.forEach((piece, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.setAttribute("aria-label", `选择第${index + 1}个图形`);
    button.innerHTML = pieceMarkup(piece);
    button.addEventListener("click", () => chooseOption(index, button));
    optionsEl.appendChild(button);
  });
  feedbackEl.className = "feedback";
  feedbackEl.textContent = "";
  nextButton.hidden = true;
}

function chooseOption(index, button) {
  if (answered) return;
  const round = rounds[roundIndex];
  if (index === round.answer) {
    answered = true;
    button.classList.add("is-correct");
    optionsEl.querySelectorAll("button").forEach((option) => { option.disabled = true; });
    feedbackEl.className = "feedback is-good";
    feedbackEl.textContent = `找到了！${round.rule} 你可以把这个理由说给妈妈听。`;
    nextButton.textContent = roundIndex === rounds.length - 1 ? "完成今天的小挑战" : "下一关";
    nextButton.hidden = false;
  } else {
    button.classList.add("is-wrong");
    button.disabled = true;
    feedbackEl.className = "feedback is-hint";
    feedbackEl.textContent = round.hint;
  }
}

nextButton.addEventListener("click", () => {
  if (roundIndex === rounds.length - 1) {
    finishPanel.hidden = false;
    document.getElementById("restart-game").focus();
    return;
  }
  roundIndex += 1;
  renderRound();
});

document.getElementById("restart-game").addEventListener("click", () => {
  roundIndex = 0;
  finishPanel.hidden = true;
  renderRound();
  document.getElementById("game-title").focus();
});

renderRound();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
