document.addEventListener('DOMContentLoaded', async () => {
  if (!window.HarvardDataStore) {
    console.error('HarvardDataStore is not available.');
    return;
  }

  await window.HarvardDataStore.ensureTrackerSeeded();
  const entries = window.HarvardDataStore.getTrackerEntries();
  renderTracker(entries);
  setupNavToggler();
});

function renderTracker(entries) {
  const container = document.querySelector('#accordionData tbody');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  entries.forEach((row, index) => {
    const collapseId = `collapse${index}`;
    const statusClass = statusToClass(row.status);
    const formattedDate = formatDisplayDate(row.date);
    const submitted = formatSubmitted(row.createdAt);
    const sourceMarkup = row.sourceLabel ? `<div class="row"><div class="col-3 col-lg-2">Source</div><div class="col-9 col-lg-10">${escapeHtml(row.sourceLabel)}</div></div>` : '';
    const linkMarkup = row.link ? `<div class="row"><div class="col-3 col-lg-2">Link</div><div class="col-9 col-lg-10"><a href="${escapeAttribute(row.link)}" target="_blank" rel="noopener">Visit resource</a></div></div>` : '';

    container.innerHTML += `
      <tr class="accordion-toggle collapsed ${statusClass}"
          role="button"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="false"
          aria-controls="${collapseId}">
        <td>${formattedDate}</td>
        <td>${escapeHtml(row.title || '')}</td>
        <td>${escapeHtml(row.status || '')}</td>
        <td class="expand-button">
          <span class="toggle-icon"><i class="bi bi-chevron-down"></i></span>
        </td>
      </tr>
      <tr>
        <td colspan="4">
          <div id="${collapseId}" class="collapse accordion-body p-3" data-bs-parent="#accordionData">
            <div class="row"><div class="col-3 col-lg-2">Organization</div><div class="col-9 col-lg-10">${escapeHtml(row.organization || '')}</div></div>
            <div class="row"><div class="col-3 col-lg-2">Type</div><div class="col-9 col-lg-10">${escapeHtml(row.type || '')}</div></div>
            <div class="row"><div class="col-3 col-lg-2">Description</div><div class="col-9 col-lg-10">${escapeHtml(row.description || '')}</div></div>
            ${sourceMarkup}
            ${linkMarkup}
            <small><em>Submitted: ${submitted}</em></small>
          </div>
        </td>
      </tr>`;
  });
}

function statusToClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'resolved':
    case 'closed':
      return 'status-resolved';
    case 'in progress':
      return 'status-progress';
    case 'not taken':
    case 'open':
      return 'status-not-taken';
    default:
      return '';
  }
}

function formatDisplayDate(date) {
  if (!date) {
    return '';
  }
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return escapeHtml(date);
    }
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return escapeHtml(date);
  }
}

function formatSubmitted(date) {
  if (!date) {
    return '';
  }
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return escapeHtml(date);
    }
    return parsed.toLocaleString();
  } catch (error) {
    return escapeHtml(date);
  }
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

function setupNavToggler() {
  const offcanvas = document.getElementById('offcanvasNav');
  const toggler = document.querySelector('[data-bs-toggle="offcanvas"][data-bs-target="#offcanvasNav"]');

  if (offcanvas && toggler) {
    offcanvas.addEventListener('show.bs.offcanvas', () => toggler.classList.add('is-open'));
    offcanvas.addEventListener('hide.bs.offcanvas', () => toggler.classList.remove('is-open'));
  }
}
