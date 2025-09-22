(function (window) {
  const CSV_URL = 'Content Tracker _ Timeline - Timeline of Events.csv';
  const STORAGE_KEYS = {
    timeline: 'harvardTimelineCustomEvents',
    tracker: 'harvardTrackerCustomItems'
  };
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let cachedCsvRecords = null;
  let csvLoadPromise = null;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function readStorage(key) {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(key) : null;
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Unable to read from storage', error);
      return [];
    }
  }

  function writeStorage(key, value) {
    try {
      if (!window.localStorage) {
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Unable to write to storage', error);
    }
  }

  function normaliseSource(value) {
    if (!value) {
      return { link: '', label: '' };
    }
    const trimmed = String(value).trim();
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        return { link: trimmed, label: url.hostname.replace(/^www\./, '') };
      } catch (error) {
        return { link: trimmed, label: trimmed };
      }
    }
    return { link: '', label: trimmed };
  }

  function createSortKey(year, month, day, fallback) {
    if (year && month) {
      const resolvedDay = day || 1;
      return Number(`${year}${pad(month)}${pad(resolvedDay)}`);
    }
    if (fallback) {
      const timestamp = Date.parse(fallback);
      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }
    return Number.MAX_SAFE_INTEGER;
  }

  function parseDateParts(yearString, dateString) {
    const result = {
      year: null,
      yearDisplay: '',
      month: null,
      monthPadded: '',
      monthName: '',
      day: null,
      displayDate: '',
      dateText: '',
      sortKey: Number.MAX_SAFE_INTEGER,
      raw: dateString || ''
    };

    const baseYear = parseInt(yearString, 10);
    if (!Number.isNaN(baseYear)) {
      result.year = baseYear;
      result.yearDisplay = String(baseYear);
    } else if (yearString) {
      result.yearDisplay = String(yearString);
    }

    if (!dateString) {
      if (result.year) {
        result.sortKey = Number(`${result.year}0000`);
      }
      return result;
    }

    const trimmed = String(dateString).trim();
    if (!trimmed) {
      if (result.year) {
        result.sortKey = Number(`${result.year}0000`);
      }
      return result;
    }

    const numericMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (numericMatch) {
      const month = parseInt(numericMatch[1], 10);
      const day = parseInt(numericMatch[2], 10);
      let parsedYear = numericMatch[3] ? parseInt(numericMatch[3], 10) : null;
      if (!Number.isNaN(parsedYear) && parsedYear !== null && numericMatch[3].length === 2) {
        const centuryBase = result.year && result.year >= 1900 ? Math.floor(result.year / 100) * 100 : 2000;
        parsedYear = centuryBase + parsedYear;
      }
      if (Number.isNaN(parsedYear)) {
        parsedYear = null;
      }
      const finalYear = parsedYear || result.year || null;
      if (finalYear) {
        result.year = finalYear;
        result.yearDisplay = String(finalYear);
      }
      result.month = Number.isNaN(month) ? null : month;
      result.day = Number.isNaN(day) ? null : day;
      if (result.month) {
        result.monthName = monthNames[result.month - 1] || '';
        result.monthPadded = pad(result.month);
      }
      if (result.monthName && result.day) {
        result.displayDate = `${result.monthName} ${result.day}`;
        result.dateText = finalYear ? `${result.displayDate}, ${finalYear}` : result.displayDate;
      } else if (result.monthName) {
        result.displayDate = result.monthName;
        result.dateText = result.monthName;
      } else {
        result.displayDate = trimmed;
        result.dateText = trimmed;
      }
      result.sortKey = createSortKey(result.year, result.month, result.day);
      return result;
    }

    const candidate = new Date(trimmed + (result.year ? ` ${result.year}` : ''));
    if (!Number.isNaN(candidate.getTime())) {
      result.year = candidate.getFullYear();
      result.yearDisplay = String(result.year);
      result.month = candidate.getMonth() + 1;
      result.monthPadded = pad(result.month);
      result.day = candidate.getDate();
      result.monthName = monthNames[result.month - 1] || '';
      result.displayDate = result.monthName
        ? `${result.monthName} ${result.day}`
        : candidate.toLocaleDateString('en-US');
      result.dateText = result.displayDate;
      result.sortKey = createSortKey(result.year, result.month, result.day);
      return result;
    }

    result.displayDate = trimmed;
    result.dateText = trimmed;
    if (result.year) {
      result.sortKey = Number(`${result.year}0000`);
    }
    return result;
  }

  function parseCsvRecords(rows) {
    const records = [];
    let currentYear = '';
    rows.forEach((row, index) => {
      if (!Array.isArray(row) || row.length === 0) {
        return;
      }
      const [rawYear = '', rawDate = '', rawEvent = '', rawSource = '', rawType = ''] = row;
      if (index === 0 && String(rawDate).toLowerCase().includes('date')) {
        return;
      }
      const yearCell = String(rawYear || '').trim();
      const dateCell = String(rawDate || '').trim();
      const eventCell = String(rawEvent || '').trim();
      const sourceCell = String(rawSource || '').trim();
      const typeCell = String(rawType || '').trim();

      if (yearCell) {
        currentYear = yearCell;
      }
      const effectiveYear = yearCell || currentYear;

      if (!eventCell && !dateCell) {
        return;
      }

      const parsedDate = parseDateParts(effectiveYear, dateCell);
      const sourceInfo = normaliseSource(sourceCell);

      records.push({
        index,
        yearString: effectiveYear,
        dateRaw: dateCell,
        event: eventCell,
        source: sourceCell,
        sourceLink: sourceInfo.link,
        sourceLabel: sourceInfo.label,
        type: typeCell,
        parsedDate
      });
    });
    return records;
  }

  function getCsvRecords() {
    if (cachedCsvRecords) {
      return Promise.resolve(cachedCsvRecords);
    }
    if (csvLoadPromise) {
      return csvLoadPromise;
    }
    csvLoadPromise = new Promise((resolve, reject) => {
      if (typeof window.Papa === 'undefined') {
        reject(new Error('Papa Parse library is required to load CSV data.'));
        csvLoadPromise = null;
        return;
      }
      window.Papa.parse(CSV_URL, {
        download: true,
        skipEmptyLines: false,
        complete: (results) => {
          try {
            cachedCsvRecords = parseCsvRecords(results.data || []);
            resolve(cachedCsvRecords);
          } catch (error) {
            reject(error);
          } finally {
            csvLoadPromise = null;
          }
        },
        error: (error) => {
          csvLoadPromise = null;
          reject(error);
        }
      });
    });
    return csvLoadPromise;
  }

  function formatTimelineEvent(record) {
    const { parsedDate } = record;
    return {
      id: `csv-${record.index}`,
      origin: 'csv',
      title: record.event,
      summary: '',
      type: record.type,
      year: parsedDate.year,
      yearDisplay: parsedDate.yearDisplay || record.yearString || '',
      month: parsedDate.month,
      monthPadded: parsedDate.monthPadded,
      day: parsedDate.day,
      monthName: parsedDate.monthName,
      displayDate: parsedDate.displayDate,
      dateText: parsedDate.dateText,
      sortKey: parsedDate.sortKey,
      link: record.sourceLink,
      sourceLabel: record.sourceLabel,
      sourceRaw: record.source,
      rawDate: record.dateRaw
    };
  }

  function deriveTimelineEventFromLocal(entry, index) {
    const year = entry.year ? parseInt(entry.year, 10) : null;
    const month = entry.month ? parseInt(entry.month, 10) : null;
    const day = entry.day ? parseInt(entry.day, 10) : null;
    const monthName = month ? monthNames[month - 1] || '' : '';
    const sortKey = createSortKey(year, month, day, entry.createdAt);
    const sourceInfo = normaliseSource(entry.link || '');
    const monthPortion = monthName ? `${monthName}${day ? ` ${day}` : ''}` : '';
    const fallbackDisplay = entry.displayDate || monthPortion;
    const dateText = fallbackDisplay
      ? year
        ? `${fallbackDisplay}${fallbackDisplay.includes(String(year)) ? '' : `, ${year}`}`
        : fallbackDisplay
      : (year ? String(year) : '');

    return {
      id: `local-${index}-${sortKey}`,
      origin: 'local',
      title: entry.title || '',
      summary: entry.summary || '',
      type: entry.type || 'Community submission',
      year,
      yearDisplay: year ? String(year) : (entry.year || ''),
      month,
      monthPadded: month ? pad(month) : '',
      day,
      monthName,
      displayDate: fallbackDisplay,
      dateText,
      sortKey,
      link: entry.link || '',
      sourceLabel: sourceInfo.label || (entry.link ? 'Link' : ''),
      sourceRaw: entry.link || '',
      rawDate: fallbackDisplay,
      imageData: entry.imageData || ''
    };
  }

  function mergeTimelineEvents(csvEvents, localEntries) {
    const combined = [...csvEvents, ...localEntries];
    combined.sort((a, b) => {
      const aKey = typeof a.sortKey === 'number' ? a.sortKey : Number.MAX_SAFE_INTEGER;
      const bKey = typeof b.sortKey === 'number' ? b.sortKey : Number.MAX_SAFE_INTEGER;
      return bKey - aKey;
    });
    return combined;
  }

  function loadTimelineEvents() {
    const localEntries = readStorage(STORAGE_KEYS.timeline).map(deriveTimelineEventFromLocal);
    return getCsvRecords()
      .then((records) => records.map(formatTimelineEvent))
      .then((csvEvents) => mergeTimelineEvents(csvEvents, localEntries))
      .catch((error) => {
        console.warn('Unable to load CSV timeline data', error);
        if (localEntries.length) {
          return mergeTimelineEvents([], localEntries);
        }
        throw error;
      });
  }

  function formatTrackerItem(record) {
    const { parsedDate } = record;
    const status = record.type || 'Uncategorized';
    return {
      id: `csv-${record.index}`,
      origin: 'csv',
      title: record.event,
      status,
      statusDisplay: status,
      organization: record.sourceLabel,
      type: record.type,
      description: record.event,
      sourceLink: record.sourceLink,
      sourceLabel: record.sourceLabel,
      dateDisplay: parsedDate.dateText || record.dateRaw || record.yearString || '',
      sortKey: parsedDate.sortKey,
      recordedAt: parsedDate.dateText || '',
      rawDate: record.dateRaw,
      yearDisplay: parsedDate.yearDisplay || record.yearString || ''
    };
  }

  function formatIsoDate(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function deriveTrackerItemFromLocal(entry, index) {
    let year = null;
    let month = null;
    let day = null;
    let displayDate = entry.dateDisplay || '';
    if (entry.date) {
      const date = new Date(entry.date);
      if (!Number.isNaN(date.getTime())) {
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
        displayDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    const sortKey = createSortKey(year, month, day, entry.createdAt || entry.date);
    const linkInfo = normaliseSource(entry.link || '');
    return {
      id: `local-${index}-${sortKey}`,
      origin: 'local',
      title: entry.title || '',
      status: entry.status || 'Submitted',
      statusDisplay: entry.status || 'Submitted',
      organization: entry.organization || '',
      type: entry.type || '',
      description: entry.description || '',
      sourceLink: linkInfo.link,
      sourceLabel: entry.linkLabel || linkInfo.label,
      dateDisplay: displayDate || entry.date || '',
      sortKey,
      recordedAt: formatIsoDate(entry.actionDate || ''),
      rawDate: entry.date || '',
      yearDisplay: year ? String(year) : (entry.year || '')
    };
  }

  function mergeTrackerItems(csvItems, localItems) {
    const combined = [...csvItems, ...localItems];
    combined.sort((a, b) => {
      const aKey = typeof a.sortKey === 'number' ? a.sortKey : Number.MAX_SAFE_INTEGER;
      const bKey = typeof b.sortKey === 'number' ? b.sortKey : Number.MAX_SAFE_INTEGER;
      return bKey - aKey;
    });
    return combined;
  }

  function loadTrackerItems() {
    const localEntries = readStorage(STORAGE_KEYS.tracker).map(deriveTrackerItemFromLocal);
    return getCsvRecords()
      .then((records) => records.map(formatTrackerItem))
      .then((csvItems) => mergeTrackerItems(csvItems, localEntries))
      .catch((error) => {
        console.warn('Unable to load CSV tracker data', error);
        if (localEntries.length) {
          return mergeTrackerItems([], localEntries);
        }
        throw error;
      });
  }

  function saveTimelineSubmission(entry) {
    const current = readStorage(STORAGE_KEYS.timeline);
    const payload = {
      ...entry,
      createdAt: new Date().toISOString()
    };
    current.push(payload);
    writeStorage(STORAGE_KEYS.timeline, current);
  }

  function saveTrackerSubmission(entry) {
    const current = readStorage(STORAGE_KEYS.tracker);
    const payload = {
      ...entry,
      createdAt: new Date().toISOString()
    };
    current.push(payload);
    writeStorage(STORAGE_KEYS.tracker, current);
  }

  window.DataLoader = {
    loadTimelineEvents,
    loadTrackerItems,
    saveTimelineSubmission,
    saveTrackerSubmission,
    helpers: {
      monthNames: monthNames.slice(),
      pad,
      normaliseSource,
      createSortKey,
      parseDateParts
    }
  };
})(window);
