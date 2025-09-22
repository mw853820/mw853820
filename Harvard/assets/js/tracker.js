(function () {
  const tableBody = document.querySelector('#accordionData tbody');
  if (!tableBody) {
    return;
  }

  const messageContainer = document.getElementById('trackerMessage');
  const offcanvas = document.getElementById('offcanvasNav');
  const toggler = document.querySelector('[data-bs-toggle="offcanvas"][data-bs-target="#offcanvasNav"]');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setMessage(text, level = 'info') {
    if (!messageContainer) {
      return;
    }
    if (!text) {
      messageContainer.classList.add('d-none');
      messageContainer.textContent = '';
      return;
    }
    messageContainer.classList.remove('d-none');
    messageContainer.className = `alert alert-${level}`;
    messageContainer.textContent = text;
  }

  function getStatusClass(status) {
    if (!status) {
      return '';
    }
    const value = status.toLowerCase();
    if (value.includes('resolved') || value.includes('closed') || value.includes('complete')) {
      return 'status-resolved';
    }
    if (value.includes('progress') || value.includes('ongoing') || value.includes('submitted')) {
      return 'status-progress';
    }
    if (value.includes('not') || value.includes('open') || value.includes('pending')) {
      return 'status-not-taken';
    }
    return '';
  }

  function buildDetailRow(label, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'row mb-2';
    const labelCol = document.createElement('div');
    labelCol.className = 'col-4 col-md-3 fw-semibold';
    labelCol.textContent = label;
    const valueCol = document.createElement('div');
    valueCol.className = 'col-8 col-md-9';
    if (content instanceof Node) {
      valueCol.appendChild(content);
    } else {
      valueCol.innerHTML = content;
    }
    wrapper.appendChild(labelCol);
    wrapper.appendChild(valueCol);
    return wrapper;
  }

  function buildLink(label, url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.textContent = label;
    return anchor;
  }

  function renderEmptyState() {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'text-center py-4 text-muted';
    cell.textContent = 'No tracker items available yet.';
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function renderTable(items) {
    tableBody.innerHTML = '';
    if (!items.length) {
      renderEmptyState();
      return;
    }

    items.forEach((item, index) => {
      const collapseId = `trackerCollapse${index}`;
      const statusClass = getStatusClass(item.statusDisplay);

      const toggleRow = document.createElement('tr');
      toggleRow.className = `accordion-toggle collapsed ${statusClass}`.trim();
      toggleRow.setAttribute('role', 'button');
      toggleRow.setAttribute('data-bs-toggle', 'collapse');
      toggleRow.setAttribute('data-bs-target', `#${collapseId}`);
      toggleRow.setAttribute('aria-expanded', 'false');
      toggleRow.setAttribute('aria-controls', collapseId);

      const dateCell = document.createElement('td');
      dateCell.textContent = item.dateDisplay || item.yearDisplay || '—';
      const titleCell = document.createElement('td');
      titleCell.textContent = item.title || 'Untitled recommendation';
      const statusCell = document.createElement('td');
      statusCell.textContent = item.statusDisplay || '';
      const expandCell = document.createElement('td');
      expandCell.className = 'expand-button';
      expandCell.innerHTML = '<span class="toggle-icon"><i class="bi bi-chevron-down"></i></span>';

      toggleRow.appendChild(dateCell);
      toggleRow.appendChild(titleCell);
      toggleRow.appendChild(statusCell);
      toggleRow.appendChild(expandCell);

      const detailRow = document.createElement('tr');
      const detailCell = document.createElement('td');
      detailCell.colSpan = 4;
      const collapse = document.createElement('div');
      collapse.id = collapseId;
      collapse.className = 'collapse accordion-body p-3';
      collapse.setAttribute('data-bs-parent', '#accordionData');

      const container = document.createElement('div');
      container.className = 'container-fluid';

      container.appendChild(buildDetailRow('Organization', escapeHtml(item.organization || '—')));
      container.appendChild(buildDetailRow('Category', escapeHtml(item.type || item.statusDisplay || '—')));
      container.appendChild(buildDetailRow('Details', escapeHtml(item.description || '—')));

      if (item.sourceLink) {
        container.appendChild(buildDetailRow('Source', buildLink(item.sourceLabel || item.sourceLink, item.sourceLink)));
      } else if (item.sourceLabel) {
        container.appendChild(buildDetailRow('Source', escapeHtml(item.sourceLabel)));
      }

      if (item.recordedAt) {
        container.appendChild(buildDetailRow('Last updated', escapeHtml(item.recordedAt)));
      }

      if (item.origin === 'local') {
        container.appendChild(buildDetailRow('Note', 'Added via submission form. Refresh this page after submitting to see your update.'));
      }

      collapse.appendChild(container);
      detailCell.appendChild(collapse);
      detailRow.appendChild(detailCell);

      tableBody.appendChild(toggleRow);
      tableBody.appendChild(detailRow);
    });
  }

  function initialiseOffcanvas() {
    if (!offcanvas || !toggler) {
      return;
    }
    offcanvas.addEventListener('show.bs.offcanvas', () => toggler.classList.add('is-open'));
    offcanvas.addEventListener('hide.bs.offcanvas', () => toggler.classList.remove('is-open'));
  }

  function initialise() {
    setMessage('Loading tracker items…', 'info');
    DataLoader.loadTrackerItems()
      .then((items) => {
        renderTable(items);
        setMessage('', 'info');
      })
      .catch(() => {
        renderTable([]);
        setMessage('Unable to load tracker information right now. Locally saved submissions will appear once data is accessible.', 'danger');
      });
    initialiseOffcanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise);
  } else {
    initialise();
  }
})();
