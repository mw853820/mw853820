(function (window) {
  'use strict';

  const STORAGE_KEY = 'harvardDataStore';
  let idCounter = 0;

  const DEFAULT_TIMELINE_DATA = [
    {
      id: 'timeline-1',
      title: 'Tech Conference',
      eventName: 'Tech Conference',
      day: '17',
      month: '09',
      year: '2025',
      summary: 'A longer paragraph about the event. Details about speakers, location, and significance go here. This section will scroll if content is longer than the allocated space.',
      link: 'https://example.com/tech-conference',
      imageUrl: 'event image.jpg',
      createdAt: '2025-09-01T12:00:00.000Z'
    },
    {
      id: 'timeline-2',
      title: 'Website Launch',
      eventName: 'Website Launch',
      day: '12',
      month: '02',
      year: '2024',
      summary: 'Details about the project, the team involved, and future goals. If this text is long, it will also scroll independently.',
      link: 'https://example.com/website-launch',
      imageUrl: 'https://via.placeholder.com/600x400',
      createdAt: '2024-02-15T09:30:00.000Z'
    },
    {
      id: 'timeline-3',
      title: 'Community Forum',
      eventName: 'Community Forum',
      day: '05',
      month: '11',
      year: '2023',
      summary: 'Students and faculty gathered to discuss initiatives that support Jewish life on campus.',
      link: 'https://example.com/community-forum',
      imageUrl: '',
      createdAt: '2023-11-06T14:15:00.000Z'
    }
  ];

  const DEFAULT_RECOMMENDATION_DATA = [
    {
      id: 'recommendation-1',
      title: 'Expand Cultural Programming',
      date: '2024-03-01',
      organization: 'Student Affairs Office',
      type: 'Programming',
      status: 'In Progress',
      actionDate: '2024-03-15',
      description: 'Collaborate with student groups to offer additional educational events throughout the semester.',
      createdAt: '2024-03-02T10:00:00.000Z'
    },
    {
      id: 'recommendation-2',
      title: 'Update Safety Protocols',
      date: '2024-01-20',
      organization: 'Campus Security',
      type: 'Policy',
      status: 'Open',
      actionDate: '',
      description: 'Review and update security procedures to address recent concerns reported by students.',
      createdAt: '2024-01-21T08:00:00.000Z'
    },
    {
      id: 'recommendation-3',
      title: 'Publish Annual Report',
      date: '2023-12-10',
      organization: 'Office of Communications',
      type: 'Reporting',
      status: 'Closed',
      actionDate: '2024-01-05',
      description: 'Release a public summary of actions taken to support Jewish campus life over the past year.',
      createdAt: '2024-01-06T16:45:00.000Z'
    }
  ];

  const storageAvailable = checkStorageAvailability();
  let state = loadInitialState();

  function checkStorageAvailability() {
    try {
      const testKey = '__harvard_data_store_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function createId(prefix) {
    idCounter += 1;
    return `${prefix}-${Date.now()}-${idCounter}`;
  }

  function toIsoString(value, fallback) {
    if (!value) {
      return fallback ? new Date(fallback).toISOString() : new Date().toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return fallback ? new Date(fallback).toISOString() : new Date().toISOString();
    }

    return date.toISOString();
  }

  function padNumber(value) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number) || number <= 0) {
      return '';
    }
    return String(number).padStart(2, '0');
  }

  function normalizeNumeric(value) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number) || number <= 0) {
      return '';
    }
    return String(number);
  }

  function normalizeTimelineEvent(event, { preserveId = false } = {}) {
    const now = new Date().toISOString();
    const normalized = {
      id: preserveId && event.id ? String(event.id) : createId('timeline'),
      title: (event.title || event.eventName || 'Untitled Event').trim(),
      eventName: (event.eventName || event.title || 'Untitled Event').trim(),
      summary: (event.summary || '').trim(),
      link: (event.link || '').trim(),
      year: normalizeNumeric(event.year),
      month: padNumber(event.month),
      day: padNumber(event.day),
      imageUrl: (event.imageUrl || '').trim(),
      createdAt: toIsoString(event.createdAt, now)
    };

    return normalized;
  }

  function normalizeRecommendation(rec, { preserveId = false } = {}) {
    const now = new Date().toISOString();
    const normalized = {
      id: preserveId && rec.id ? String(rec.id) : createId('recommendation'),
      title: (rec.title || 'Untitled Recommendation').trim(),
      date: normalizeDate(rec.date),
      organization: (rec.organization || '').trim(),
      type: (rec.type || '').trim(),
      status: (rec.status || '').trim(),
      actionDate: normalizeDate(rec.actionDate),
      description: (rec.description || '').trim(),
      createdAt: toIsoString(rec.createdAt, now)
    };

    return normalized;
  }

  function normalizeDate(value) {
    if (!value) {
      return '';
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return '';
    }

    return new Date(parsed).toISOString().split('T')[0];
  }

  function createDefaultState() {
    return {
      timelineEvents: DEFAULT_TIMELINE_DATA.map(item => normalizeTimelineEvent(item, { preserveId: true })),
      recommendations: DEFAULT_RECOMMENDATION_DATA.map(item => normalizeRecommendation(item, { preserveId: true }))
    };
  }

  function loadInitialState() {
    if (!storageAvailable) {
      return createDefaultState();
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createDefaultState();
      }

      const parsed = JSON.parse(raw);
      const state = createDefaultState();

      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.timelineEvents) && parsed.timelineEvents.length > 0) {
          state.timelineEvents = parsed.timelineEvents.map(item => normalizeTimelineEvent(item, { preserveId: true }));
        }

        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          state.recommendations = parsed.recommendations.map(item => normalizeRecommendation(item, { preserveId: true }));
        }
      }

      return state;
    } catch (error) {
      console.warn('HarvardDataStore: failed to read from localStorage', error);
      return createDefaultState();
    }
  }

  function persistState() {
    if (!storageAvailable) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('HarvardDataStore: failed to persist state', error);
    }
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureTimelineSeeded() {
    if (!Array.isArray(state.timelineEvents) || state.timelineEvents.length === 0) {
      state.timelineEvents = createDefaultState().timelineEvents;
      persistState();
    }

    return Promise.resolve(deepClone(state.timelineEvents));
  }

  function ensureRecommendationsSeeded() {
    if (!Array.isArray(state.recommendations) || state.recommendations.length === 0) {
      state.recommendations = createDefaultState().recommendations;
      persistState();
    }

    return Promise.resolve(deepClone(state.recommendations));
  }

  function ensureAllSeeded() {
    return Promise.all([ensureTimelineSeeded(), ensureRecommendationsSeeded()]);
  }

  function getTimelineEvents() {
    if (!Array.isArray(state.timelineEvents)) {
      return [];
    }

    return deepClone(state.timelineEvents).sort((a, b) => {
      const dateA = buildEventTimestamp(a);
      const dateB = buildEventTimestamp(b);
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      return 0;
    });
  }

  function buildEventTimestamp(event) {
    const year = Number.parseInt(event.year, 10) || 0;
    const month = Number.parseInt(event.month, 10) || 1;
    const day = Number.parseInt(event.day, 10) || 1;
    const base = Date.UTC(year, month - 1, day);
    const created = Date.parse(event.createdAt);
    return Number.isNaN(created) ? base : created;
  }

  function addTimelineEvent(event) {
    const normalized = normalizeTimelineEvent(event);
    state.timelineEvents = [normalized, ...state.timelineEvents];
    persistState();
    return normalized;
  }

  function getRecommendations() {
    if (!Array.isArray(state.recommendations)) {
      return [];
    }

    return deepClone(state.recommendations).sort((a, b) => {
      const dateA = buildRecommendationTimestamp(a);
      const dateB = buildRecommendationTimestamp(b);
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      return 0;
    });
  }

  function buildRecommendationTimestamp(rec) {
    const primary = Date.parse(rec.date);
    if (!Number.isNaN(primary)) {
      return primary;
    }

    const created = Date.parse(rec.createdAt);
    if (!Number.isNaN(created)) {
      return created;
    }

    return 0;
  }

  function addRecommendation(rec) {
    const normalized = normalizeRecommendation(rec);
    state.recommendations = [normalized, ...state.recommendations];
    persistState();
    return normalized;
  }

  window.HarvardDataStore = {
    ensureTimelineSeeded,
    ensureRecommendationsSeeded,
    ensureAllSeeded,
    getTimelineEvents,
    addTimelineEvent,
    getRecommendations,
    addRecommendation
  };
})(window);
