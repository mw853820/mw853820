(function (global) {
  const CSV_PATH = 'Content Tracker _ Timeline - Timeline of Events.csv';
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function loadEvents() {
    return new Promise((resolve, reject) => {
      if (typeof Papa === 'undefined') {
        reject(new Error('Papa Parse is required to load CSV data.'));
        return;
      }

      Papa.parse(CSV_PATH, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader(header) {
          const trimmed = (header || '').trim();
          return trimmed === '' ? 'Year' : trimmed;
        },
        complete(results) {
          try {
            const events = transformRows(results.data || []);
            resolve(events);
          } catch (error) {
            reject(error);
          }
        },
        error(error) {
          reject(error);
        }
      });
    });
  }

  function transformRows(rows) {
    const events = [];
    let lastYear = '';
    let lastDate = '';
    let lastSortKey = Number.NEGATIVE_INFINITY;

    rows.forEach((rawRow) => {
      const eventInfo = (rawRow['Event / Info'] || '').trim();
      if (!eventInfo) {
        return;
      }

      let year = normalizeYear(rawRow.Year);
      if (year) {
        lastYear = year;
      } else if (lastYear) {
        year = lastYear;
      }

      let rawDate = (rawRow.Date || '').toString().trim();
      if (rawDate) {
        lastDate = rawDate;
      } else if (lastDate) {
        rawDate = lastDate;
      }

      const parsedDate = parseDate(rawDate, year);
      if (parsedDate.year) {
        year = parsedDate.year;
        lastYear = year;
      }

      let sortKey = parsedDate.sortKey;
      if (!Number.isFinite(sortKey) || sortKey === Number.NEGATIVE_INFINITY) {
        sortKey = year ? new Date(Number(year), 0, 1).getTime() : lastSortKey;
      }
      if (Number.isFinite(sortKey)) {
        lastSortKey = sortKey;
      }

      const sourceRaw = (rawRow.Source || '').trim();
      const typeRaw = (rawRow.Type || '').trim();
      const type = typeRaw || 'Uncategorized';
      const typeSlug = slugify(type);

      events.push({
        title: eventInfo,
        description: eventInfo,
        year: year || '',
        monthName: parsedDate.monthName,
        monthNumber: parsedDate.monthNumber,
        day: parsedDate.day,
        rawDate: rawDate,
        displayDate: buildDisplayDate(parsedDate, year, rawDate),
        type,
        typeSlug,
        source: sourceRaw,
        sourceLink: isLikelyUrl(sourceRaw) ? sourceRaw : '',
        sortKey
      });
    });

    return events;
  }

  function buildDisplayDate(parsedDate, year, rawDate) {
    if (parsedDate.dateLabel) {
      return parsedDate.dateLabel;
    }
    if (rawDate) {
      return rawDate;
    }
    return year || 'Date TBD';
  }

  function parseDate(dateStr, fallbackYear) {
    const cleaned = (dateStr || '').replace(/\?/g, '').trim();
    if (!cleaned) {
      const year = normalizeYear(fallbackYear);
      return {
        monthNumber: '',
        monthName: '',
        day: '',
        year,
        dateLabel: year || '',
        sortKey: year ? new Date(Number(year), 0, 1).getTime() : Number.NEGATIVE_INFINITY
      };
    }

    const parts = cleaned.split('/');
    let [monthPart = '', dayPart = '', yearPart = ''] = parts;

    monthPart = monthPart.replace(/\D/g, '');
    dayPart = dayPart.replace(/\D/g, '');
    yearPart = yearPart.replace(/\D/g, '');

    const monthNumber = monthPart ? monthPart.padStart(2, '0') : '';
    const monthIndex = monthNumber ? Number(monthNumber) - 1 : NaN;
    const monthName = Number.isInteger(monthIndex) && MONTH_NAMES[monthIndex] ? MONTH_NAMES[monthIndex] : '';

    const day = dayPart ? String(parseInt(dayPart, 10)) : '';
    const year = normalizeYear(yearPart || fallbackYear);

    const labelParts = [];
    if (monthName) {
      labelParts.push(monthName);
    }
    if (day) {
      labelParts.push(day);
    }
    if (year) {
      labelParts.push(year);
    }

    let sortKey = Number.NEGATIVE_INFINITY;
    if (year) {
      const monthForDate = monthNumber ? Number(monthNumber) - 1 : 0;
      const dayForDate = day ? Number(day) : 1;
      sortKey = new Date(Number(year), monthForDate, dayForDate).getTime();
    }

    return {
      monthNumber,
      monthName,
      day,
      year,
      dateLabel: labelParts.join(' ').trim(),
      sortKey
    };
  }

  function normalizeYear(value) {
    if (value === undefined || value === null) {
      return '';
    }

    const digits = value.toString().replace(/\D/g, '');
    if (!digits) {
      return '';
    }

    if (digits.length === 4) {
      return digits;
    }

    if (digits.length === 2) {
      const numeric = Number(digits);
      const century = numeric < 50 ? '20' : '19';
      return century + digits.padStart(2, '0');
    }

    if (digits.length === 3) {
      return `2${digits.padStart(3, '0')}`;
    }

    if (digits.length === 1) {
      return `200${digits}`;
    }

    return digits;
  }

  function slugify(value) {
    const base = (value || '').toString().trim();
    if (!base) {
      return 'uncategorized';
    }
    return (
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized'
    );
  }

  function isLikelyUrl(value) {
    return /^https?:\/\//i.test(value || '');
  }

  function sortEvents(events, direction = 'desc') {
    const factor = direction === 'asc' ? 1 : -1;
    return [...events].sort((a, b) => {
      const aKey = Number.isFinite(a.sortKey) ? a.sortKey : Number.NEGATIVE_INFINITY;
      const bKey = Number.isFinite(b.sortKey) ? b.sortKey : Number.NEGATIVE_INFINITY;

      if (aKey === bKey) {
        return factor * a.title.localeCompare(b.title);
      }

      return factor * (aKey - bKey);
    });
  }

  global.HarvardData = {
    loadEvents,
    sortEvents,
    slugify,
    isLikelyUrl,
    MONTH_NAMES
  };
})(window);
