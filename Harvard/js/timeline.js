document.addEventListener('DOMContentLoaded', async () => {
  if (!window.HarvardDataStore) {
    console.error('HarvardDataStore is not available.');
    return;
  }

  await window.HarvardDataStore.ensureTimelineSeeded();
  const events = window.HarvardDataStore.getTimelineEvents();
  renderTimeline(events);
  populateFilters(events);
  setupFilterHandlers();
  setupNavToggler();
});

const filters = { year: '', month: '', type: '' };

function setupFilterHandlers() {
  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');

  if (yearSelect) {
    yearSelect.addEventListener('change', e => {
      filters.year = e.target.value;
      applyFilters();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', e => {
      filters.month = e.target.value;
      applyFilters();
    });
  }
}

function populateFilters(events) {
  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');
  if (!yearSelect || !monthSelect) {
    return;
  }

  const years = Array.from(new Set(events.filter(e => e.year).map(e => e.year))).sort((a, b) => b - a);
  const months = Array.from(new Set(events.filter(e => e.month).map(e => e.month))).sort((a, b) => a - b);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  yearSelect.innerHTML = '<option value="">All Years</option>' +
    years.map(year => `<option value="${year}">${year}</option>`).join('');

  monthSelect.innerHTML = '<option value="">All Months</option>' +
    months.map(month => {
      const padded = String(month).padStart(2, '0');
      return `<option value="${padded}">${monthNames[month - 1]}</option>`;
    }).join('');
}

function renderTimeline(events) {
  const container = document.getElementById('timeline');
  if (!container) {
    return;
  }

  const sorted = [...events].sort((a, b) => {
    const dateA = buildDateValue(a);
    const dateB = buildDateValue(b);
    return dateB - dateA;
  });

  container.innerHTML = '';

  sorted.forEach(event => {
    const row = document.createElement('div');
    row.className = 'row timeline-row';
    if (event.year) {
      row.dataset.year = event.year;
    }
    if (event.month) {
      row.dataset.month = String(event.month).padStart(2, '0');
    }
    if (event.type) {
      row.dataset.type = event.type;
    }

    const monthName = event.monthName || (event.month ? monthNameFromNumber(event.month) : '');
    const previewText = buildPreviewText(event.summary);
    const day = event.day ? `<div class="fw-bold fs-5">${escapeHtml(String(event.day))}</div>` : '';
    const imageSrc = event.imageUrl || 'https://via.placeholder.com/485x204?text=No+Image';
    const linkMarkup = event.link ? `<a href="${escapeAttribute(event.link)}" target="_blank" rel="noopener">Read more</a>` : '';
    const sourceMarkup = event.sourceLabel ? `<p class="mb-1"><strong>Source:</strong> ${escapeHtml(event.sourceLabel)}</p>` : '';

    row.innerHTML = `
      <div class="col-2 fw-bold">${event.year ? escapeHtml(String(event.year)) : ''}</div>
      <div class="col-2 text-center">
        <div>${monthName ? escapeHtml(monthName) : ''}</div>
        ${day}
      </div>
      <div class="col-1 timeline-col">
        <div class="timeline-line"></div>
        <div class="timeline-dot"></div>
      </div>
      <div class="col-7 timeline-event">
        <div class="timeline-preview">
          <h2 class="h5 mb-1">${escapeHtml(event.title || '')}</h2>
          <p class="mb-0">${escapeHtml(previewText)}</p>
        </div>
        <div class="card timeline-card">
          <div class="card-body">
            <div class="card-text-area">
              <h2 class="h5">${escapeHtml(event.title || '')}</h2>
              <p>${formatSummary(event.summary)}</p>
              ${sourceMarkup}
              ${linkMarkup}
            </div>
            <div class="image-wrapper">
              <img src="${escapeAttribute(imageSrc)}" alt="Event image">
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(row);
  });

  container.querySelectorAll('.timeline-event').forEach(eventCol => {
    eventCol.addEventListener('click', () => {
      const row = eventCol.closest('.timeline-row');
      if (!row) {
        return;
      }
      document.querySelectorAll('.timeline-row.active').forEach(openRow => {
        if (openRow !== row) {
          openRow.classList.remove('active');
        }
      });
      row.classList.toggle('active');
    });
  });
}

function formatSummary(text) {
  if (!text) {
    return '';
  }
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function buildDateValue(event) {
  const year = event.year || 0;
  const month = event.month ? event.month - 1 : 0;
  const day = event.day || 1;
  return new Date(year, month, day).getTime();
}

function monthNameFromNumber(number) {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return names[number - 1] || '';
}

function escapeHtml(value) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function buildPreviewText(summary) {
  const clean = (summary || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) {
    return clean;
  }
  return `${clean.slice(0, 157)}...`;
}

function applyFilters() {
  document.querySelectorAll('#timeline .timeline-row').forEach(row => {
    const match = (
      (!filters.year || row.dataset.year === filters.year) &&
      (!filters.month || row.dataset.month === filters.month) &&
      (!filters.type || row.dataset.type === filters.type)
    );
    row.style.display = match ? '' : 'none';
  });
}

function setupNavToggler() {
  const offcanvas = document.getElementById('offcanvasNav');
  const toggler = document.querySelector('[data-bs-toggle="offcanvas"][data-bs-target="#offcanvasNav"]');

  if (offcanvas && toggler) {
    offcanvas.addEventListener('show.bs.offcanvas', () => toggler.classList.add('is-open'));
    offcanvas.addEventListener('hide.bs.offcanvas', () => toggler.classList.remove('is-open'));
  }
}
