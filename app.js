import { createCalculator, formatDisplayValue, formatNumber } from "./calculator.js";
import {
  createHistoryEntry,
  getHistoryRelationSymbol,
  groupHistoryEntries,
  removeHistoryDate,
  removeHistoryEntry,
} from "./history.js";
import { loadHistoryEntries, saveHistoryEntries } from "./storage.js";

const calculator = createCalculator();
let historyEntries = loadHistoryEntries();
let pendingDeleteAction = null;
let noticeTimer = null;
let openHistoryEntry = null;

const expressionElement = document.querySelector(".expression");
const resultElement = document.querySelector(".result");
const historyList = document.querySelector(".history-list");
const historyScroll = document.querySelector(".history-scroll");
const clearHistoryButton = document.querySelector(".text-button");
const confirmDialog = document.querySelector(".confirm-dialog");
const confirmDescription = document.querySelector("#confirm-description");
const storageNotice = document.querySelector(".storage-notice");
const numberButtons = document.querySelectorAll("[data-value]");
const operationButtons = document.querySelectorAll("[data-operation]");
const actionButtons = document.querySelectorAll("[data-action]");

numberButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.inputValue(button.dataset.value);
    render();
  });
});

operationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.chooseOperation(button.dataset.operation);
    render();
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleAction(button.dataset.action);
  });
});

clearHistoryButton.addEventListener("click", () => {
  if (historyEntries.length === 0) {
    return;
  }

  openDeleteDialog("确定要清空全部计算历史吗？此操作无法撤销。", () => {
    updateHistoryEntries([]);
  });
});

confirmDialog.addEventListener("close", () => {
  if (confirmDialog.returnValue === "confirm") {
    pendingDeleteAction?.();
  }

  pendingDeleteAction = null;
});

document.addEventListener("keydown", (event) => {
  const operationByKey = {
    "+": "add",
    "-": "subtract",
    "*": "multiply",
    "/": "divide",
  };

  if (/^[0-9.]$/.test(event.key)) {
    calculator.inputValue(event.key);
  } else if (operationByKey[event.key]) {
    calculator.chooseOperation(operationByKey[event.key]);
  } else if (event.key === "Enter" || event.key === "=") {
    storeCompletedCalculation(calculator.calculateResult());
  } else if (event.key === "Escape") {
    calculator.clear();
  } else if (event.key === "Backspace") {
    calculator.backspace();
  } else if (event.key === "%") {
    calculator.inputPercent();
  } else {
    return;
  }

  event.preventDefault();
  render();
});

function handleAction(action) {
  switch (action) {
    case "clear":
      calculator.clear();
      break;
    case "backspace":
      calculator.backspace();
      break;
    case "toggle-sign":
      calculator.toggleSign();
      break;
    case "percent":
      calculator.inputPercent();
      break;
    case "equals":
      storeCompletedCalculation(calculator.calculateResult());
      break;
    default:
      return;
  }

  render();
}

function storeCompletedCalculation(completedCalculation) {
  if (completedCalculation === null) {
    return;
  }

  const nextEntries = [...historyEntries, createHistoryEntry(completedCalculation)];

  if (updateHistoryEntries(nextEntries, true)) {
    return;
  }

  showNotice("历史记录保存失败，请清理部分记录后重试。");
}

function updateHistoryEntries(nextEntries, scrollToLatest = false) {
  if (!saveHistoryEntries(nextEntries)) {
    showNotice("无法更新历史记录，浏览器存储空间可能不足。");
    return false;
  }

  historyEntries = nextEntries;
  renderHistory(scrollToLatest);
  return true;
}

function renderHistory(scrollToLatest = false) {
  historyList.replaceChildren();
  clearHistoryButton.disabled = historyEntries.length === 0;

  groupHistoryEntries(historyEntries).forEach((group) => {
    const groupElement = document.createElement("section");
    groupElement.className = "history-group";

    const dateButton = document.createElement("button");
    dateButton.type = "button";
    dateButton.className = "history-date";
    dateButton.setAttribute("aria-label", `清空${group.label}的 ${group.entries.length} 条记录`);
    dateButton.innerHTML = `<span>${group.label}</span><span class="history-date-count">${group.entries.length} 条</span>`;
    dateButton.addEventListener("click", () => {
      openDeleteDialog(`确定要清空“${group.label}”的全部 ${group.entries.length} 条记录吗？`, () => {
        updateHistoryEntries(removeHistoryDate(historyEntries, group.dateKey));
      });
    });

    const itemsElement = document.createElement("div");
    itemsElement.className = "history-items";

    group.entries.forEach((entry) => {
      const relationSymbol = getHistoryRelationSymbol(entry);
      const entryShell = document.createElement("div");
      entryShell.className = "history-entry-shell";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "history-entry-delete";
      deleteButton.textContent = "删除";
      deleteButton.disabled = true;
      deleteButton.setAttribute("aria-label", `删除记录 ${entry.expression} ${relationSymbol} ${formatNumber(entry.result)}`);

      const entryButton = document.createElement("button");
      entryButton.type = "button";
      entryButton.className = "history-entry";
      entryButton.setAttribute("aria-label", `${entry.expression} ${relationSymbol} ${formatNumber(entry.result)}，向左滑动或按 Delete 键可删除`);

      const expressionElement = document.createElement("span");
      expressionElement.className = "history-entry-expression";
      expressionElement.textContent = entry.expression;

      const resultElement = document.createElement("span");
      resultElement.className = "history-entry-result";
      resultElement.textContent = `${relationSymbol} ${formatNumber(entry.result)}`;

      entryButton.append(expressionElement, resultElement);
      const requestEntryDeletion = () => {
        openDeleteDialog(`确定要删除“${entry.expression} ${relationSymbol} ${formatNumber(entry.result)}”吗？`, () => {
          updateHistoryEntries(removeHistoryEntry(historyEntries, entry.id));
        });
      };
      deleteButton.addEventListener("click", requestEntryDeletion);
      entryButton.addEventListener("keydown", (event) => {
        if (event.key !== "Delete") {
          return;
        }

        event.preventDefault();
        requestEntryDeletion();
      });
      attachSwipeToDelete(entryShell, entryButton, deleteButton);
      entryShell.append(deleteButton, entryButton);
      itemsElement.append(entryShell);
    });

    groupElement.append(dateButton, itemsElement);
    historyList.append(groupElement);
  });

  if (scrollToLatest) {
    requestAnimationFrame(() => {
      historyScroll.scrollTop = historyScroll.scrollHeight;
    });
  }
}

function attachSwipeToDelete(entryShell, entryButton, deleteButton) {
  let startX = 0;
  let startY = 0;
  let horizontalDistance = 0;
  let isTracking = false;

  entryButton.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
    horizontalDistance = 0;
    isTracking = true;
    entryButton.setPointerCapture(event.pointerId);
  });

  entryButton.addEventListener("pointermove", (event) => {
    if (!isTracking) {
      return;
    }

    const distanceX = event.clientX - startX;
    const distanceY = event.clientY - startY;

    if (Math.abs(distanceY) > Math.abs(distanceX)) {
      return;
    }

    horizontalDistance = Math.min(0, Math.max(-80, distanceX));
    entryButton.style.transform = `translateX(${horizontalDistance}px)`;
  });

  const finishSwipe = () => {
    if (!isTracking) {
      return;
    }

    isTracking = false;
    const shouldOpen = horizontalDistance <= -36;

    if (openHistoryEntry && openHistoryEntry !== entryShell) {
      closeHistoryEntry(openHistoryEntry);
    }

    entryShell.classList.toggle("is-delete-visible", shouldOpen);
    deleteButton.disabled = !shouldOpen;
    entryButton.style.removeProperty("transform");
    openHistoryEntry = shouldOpen ? entryShell : null;
  };

  entryButton.addEventListener("pointerup", finishSwipe);
  entryButton.addEventListener("pointercancel", finishSwipe);
}

function closeHistoryEntry(entryShell) {
  entryShell.classList.remove("is-delete-visible");
  const deleteButton = entryShell.querySelector(".history-entry-delete");
  if (deleteButton) {
    deleteButton.disabled = true;
  }
  entryShell.querySelector(".history-entry")?.style.removeProperty("transform");
}

function openDeleteDialog(description, deleteAction) {
  confirmDescription.textContent = description;
  pendingDeleteAction = deleteAction;
  confirmDialog.showModal();
}

function showNotice(message) {
  storageNotice.textContent = message;
  storageNotice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    storageNotice.hidden = true;
  }, 4000);
}

function render() {
  const state = calculator.getState();
  expressionElement.textContent = state.expression;
  resultElement.textContent = state.hasError ? "错误" : formatDisplayValue(state.displayValue);

  operationButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.operation === state.pendingOperation);
  });
}

renderHistory();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      showNotice("离线功能暂时不可用，请刷新页面重试。");
    });
  });
}
