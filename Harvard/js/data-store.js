(function () {
  const TIMELINE_STORAGE_KEY = 'harvardTimelineEvents';
  const TRACKER_STORAGE_KEY = 'harvardTrackerEntries';
  const TIMELINE_SEEDED_KEY = 'harvardTimelineSeeded';
  const TRACKER_SEEDED_KEY = 'harvardTrackerSeeded';
  const TIMELINE_CSV_PATH = 'data/timeline.csv';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function safeGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Unable to access localStorage', error);
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error('Unable to write to localStorage', error);
    }
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/);
    const data = [];
    let currentYear = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) {
        continue;
      }

      const cells = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());

      if (cells.length < 3) {
        continue;
      }

      const yearCell = cells[0];
      const dateCell = cells[1];
      const description = cells[2];
      const sourceCell = cells[3] || '';
      const typeCell = cells[4] || '';

      if (!description) {
        continue;
      }

      if (yearCell) {
        currentYear = yearCell;
      }

      const parsedDate = parseDate(dateCell, currentYear);
      const { year, month, day } = parsedDate;

      const entry = {
        id: `seed-${i}`,
        title: buildTitle(description),
        summary: description,
        year,
        month,
        day,
        monthName: month ? monthNames[month - 1] : '',
        type: typeCell,
        sourceLabel: sourceCell && !looksLikeUrl(sourceCell) ? sourceCell : '',
        link: looksLikeUrl(sourceCell) ? sourceCell : '',
        createdAt: new Date().toISOString(),
        imageUrl: ''
      };

      data.push(entry);
    }

    return data;
  }

  function parseDate(dateString, fallbackYear) {
    const clean = (dateString || '').replace(/\?/g, '').trim();
    const response = { year: null, month: null, day: null };

    if (clean) {
      const match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (match) {
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);
        if (year < 100) {
          year += year >= 70 ? 1900 : 2000;
        }
        response.year = year;
        response.month = month;
        response.day = day;
        return response;
      }
    }

    if (fallbackYear) {
      const yearNum = parseInt(fallbackYear, 10);
      if (!Number.isNaN(yearNum)) {
        response.year = yearNum;
      }
    }

    return response;
  }

  function buildTitle(description) {
    const clean = description.replace(/\s+/g, ' ').trim();
    if (clean.length <= 80) {
      return clean;
    }
    return `${clean.slice(0, 77)}...`;
  }

  function looksLikeUrl(value) {
    return /^https?:\/\//i.test(value || '');
  }

  function getTimelineEvents() {
    const raw = safeGetItem(TIMELINE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse stored timeline events', error);
      return [];
    }
  }

  function setTimelineEvents(events) {
    safeSetItem(TIMELINE_STORAGE_KEY, JSON.stringify(events));
  }

  async function ensureTimelineSeeded() {
    const seeded = safeGetItem(TIMELINE_SEEDED_KEY);
    if (seeded) {
      return;
    }

    try {
      const response = await fetch(TIMELINE_CSV_PATH);
      if (!response.ok) {
        throw new Error(`Failed to load timeline CSV: ${response.status}`);
      }
      const text = await response.text();
      const data = parseCsv(text);
      setTimelineEvents(data);
      safeSetItem(TIMELINE_SEEDED_KEY, 'true');
    } catch (error) {
      console.error('Unable to seed timeline data', error);
    }
  }

  function addTimelineEvent(event) {
    const events = getTimelineEvents();
    const now = new Date();
    const entry = {
      id: `user-${now.getTime()}`,
      title: event.title || buildTitle(event.summary || event.eventName || ''),
      summary: event.summary || event.eventName || '',
      year: event.year ? parseInt(event.year, 10) : null,
      month: event.month ? parseInt(event.month, 10) : null,
      day: event.day ? parseInt(event.day, 10) : null,
      monthName: event.month ? monthNames[parseInt(event.month, 10) - 1] : '',
      type: event.type || 'Submission',
      sourceLabel: event.sourceLabel || '',
      link: event.link || '',
      createdAt: now.toISOString(),
      imageUrl: event.imageUrl || ''
    };

    if (!entry.year && event.year) {
      const yearNum = parseInt(event.year, 10);
      if (!Number.isNaN(yearNum)) {
        entry.year = yearNum;
      }
    }

    if (!entry.month && event.month) {
      const monthNum = parseInt(event.month, 10);
      if (!Number.isNaN(monthNum)) {
        entry.month = monthNum;
        entry.monthName = monthNames[monthNum - 1] || '';
      }
    }

    if (!entry.day && event.day) {
      const dayNum = parseInt(event.day, 10);
      if (!Number.isNaN(dayNum)) {
        entry.day = dayNum;
      }
    }

    events.push(entry);
    setTimelineEvents(events);
  }

  function getTrackerEntries() {
    const raw = safeGetItem(TRACKER_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse stored tracker entries', error);
      return [];
    }
  }

  function setTrackerEntries(entries) {
    safeSetItem(TRACKER_STORAGE_KEY, JSON.stringify(entries));
  }

  async function ensureTrackerSeeded() {
    const seeded = safeGetItem(TRACKER_SEEDED_KEY);
    if (seeded) {
      return;
    }

    const seedData = [
      {
        id: 'tracker-seed-1',
        title: 'Presidential Task Force on Combating Antisemitism',
        date: '2024-01-19',
        organization: 'Harvard University',
        type: 'Task Force',
        status: 'In Progress',
        actionDate: '',
        description: 'Interim President Garber announces the creation of task forces focused on combating antisemitism and Islamophobia.',
        sourceLabel: 'Harvard',
        link: ''
      },
      {
        id: 'tracker-seed-2',
        title: 'Guidance on Protest and Dissent',
        date: '2024-01-20',
        organization: 'Harvard University',
        type: 'Policy Update',
        status: 'Closed',
        actionDate: '2024-01-20',
        description: 'Guidance clarifies where protests are not allowed and reinforces expectations for invited speakers.',
        sourceLabel: 'Crimson',
        link: ''
      },
      {
        id: 'tracker-seed-3',
        title: 'Task Force Preliminary Recommendations',
        date: '2024-06-26',
        organization: 'Harvard Task Forces',
        type: 'Recommendations',
        status: 'Open',
        actionDate: '',
        description: 'Task forces release preliminary recommendations addressing antisemitism and anti-Arab bias.',
        sourceLabel: 'Crimson',
        link: ''
      },
      {
        id: 'tracker-seed-4',
        title: 'Implementation Call by Harvard Hillel',
        date: '2024-06-27',
        organization: 'Harvard Hillel',
        type: 'Community Response',
        status: 'In Progress',
        actionDate: '',
        description: 'Harvard Hillel calls for swift implementation of both the task force and Hillel proposals.',
        sourceLabel: 'Hillel Email',
        link: ''
      }
    ];

    const withTimestamps = seedData.map(item => ({
      ...item,
      createdAt: new Date().toISOString()
    }));

    setTrackerEntries(withTimestamps);
    safeSetItem(TRACKER_SEEDED_KEY, 'true');
  }

  function addTrackerEntry(entry) {
    const entries = getTrackerEntries();
    const now = new Date();

    entries.push({
      id: `tracker-${now.getTime()}`,
      title: entry.title || '',
      date: entry.date || '',
      organization: entry.organization || '',
      type: entry.type || '',
      status: entry.status || 'Open',
      actionDate: entry.actionDate || '',
      description: entry.description || '',
      sourceLabel: entry.sourceLabel || '',
      link: entry.link || '',
      createdAt: now.toISOString()
    });

    setTrackerEntries(entries);
  }

  window.HarvardDataStore = {
    ensureTimelineSeeded,
    getTimelineEvents,
    addTimelineEvent,
    ensureTrackerSeeded,
    getTrackerEntries,
    addTrackerEntry
  };
})();
