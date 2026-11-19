const HISTORY_KEY = "memory-calculator:history";

export function loadHistoryEntries() {
  try {
    const storedValue = localStorage.getItem(HISTORY_KEY);

    if (storedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isValidHistoryEntry);
  } catch {
    return [];
  }
}

export function saveHistoryEntries(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function isValidHistoryEntry(entry) {
  return (
    typeof entry?.id === "string" &&
    typeof entry.expression === "string" &&
    typeof entry.result === "number" &&
    Number.isFinite(entry.result) &&
    typeof entry.createdAt === "string" &&
    Number.isFinite(Date.parse(entry.createdAt))
  );
}
