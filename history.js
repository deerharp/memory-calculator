export function createHistoryEntry(calculation, createdAt = new Date()) {
  return {
    id: createId(),
    expression: calculation.expression,
    result: calculation.result,
    isApproximate: calculation.isApproximate,
    createdAt: createdAt.toISOString(),
  };
}

export function groupHistoryEntries(entries, now = new Date()) {
  const groupsByDate = new Map();

  [...entries]
    .sort((leftEntry, rightEntry) => Date.parse(leftEntry.createdAt) - Date.parse(rightEntry.createdAt))
    .forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      const dateKey = getLocalDateKey(entryDate);

      if (!groupsByDate.has(dateKey)) {
        groupsByDate.set(dateKey, {
          dateKey,
          label: formatDateLabel(entryDate, now),
          entries: [],
        });
      }

      groupsByDate.get(dateKey).entries.push(entry);
    });

  return [...groupsByDate.values()];
}

export function removeHistoryEntry(entries, entryId) {
  return entries.filter((entry) => entry.id !== entryId);
}

export function removeHistoryDate(entries, dateKey) {
  return entries.filter((entry) => getLocalDateKey(new Date(entry.createdAt)) !== dateKey);
}

export function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getHistoryRelationSymbol(entry) {
  if (typeof entry.isApproximate === "boolean") {
    return entry.isApproximate ? "≈" : "=";
  }

  return inferApproximation(entry) ? "≈" : "=";
}

function inferApproximation(entry) {
  const match = entry.expression.match(/^(.+) ([+−×÷]) (.+)$/);

  if (!match) {
    return false;
  }

  const leftValue = Number(match[1].replaceAll(",", ""));
  const rightValue = Number(match[3].replaceAll(",", ""));
  const operation = match[2];
  const rawResultByOperation = {
    "+": leftValue + rightValue,
    "−": leftValue - rightValue,
    "×": leftValue * rightValue,
    "÷": rightValue === 0 ? Number.NaN : leftValue / rightValue,
  };
  const rawResult = rawResultByOperation[operation];

  return Number.isFinite(rawResult) && Math.abs(rawResult - Number(entry.result)) > 1e-10;
}

function formatDateLabel(date, now) {
  const todayStart = startOfDay(now);
  const entryStart = startOfDay(date);
  const differenceInDays = Math.round((todayStart - entryStart) / 86_400_000);

  if (differenceInDays === 0) {
    return "今天";
  }

  if (differenceInDays === 1) {
    return "昨天";
  }

  const includeYear = date.getFullYear() !== now.getFullYear();
  return new Intl.DateTimeFormat("zh-CN", {
    year: includeYear ? "numeric" : undefined,
    month: "long",
    day: "numeric",
  }).format(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function createId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
