(function () {
  const timelineContainer = document.getElementById('timeline');
  if (!timelineContainer) {
    return;
  }

  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');
  const messageContainer = document.getElementById('timelineMessage');
  const typeList = document.getElementById('timelineTypeList');
  const state = {
    events: []
  };

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

  function clearTimeline() {
    while (timelineContainer.firstChild) {
      timelineContainer.removeChild(timelineContainer.firstChild);
    }
  }

  function renderEmptyState() {
    const message = document.createElement('p');
    message.className = 'text-muted';
    message.textContent = 'No events match the selected filters yet.';
    timelineContainer.appendChild(message);
  }

  function buildMetaList(event) {
    const list = document.createElement('ul');
    list.className = 'list-unstyled small mb-0';

    if (event.dateText) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Date:</strong> ${escapeHtml(event.dateText)}`;
      list.appendChild(li);
    }

    if (event.type) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Category:</strong> ${escapeHtml(event.type)}`;
      list.appendChild(li);
    }

    if (event.sourceLabel) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = 'Source:';
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' '));
      if (event.link) {
        const anchor = document.createElement('a');
        anchor.href = event.link;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = event.sourceLabel;
        li.appendChild(anchor);
      } else {
        li.appendChild(document.createTextNode(event.sourceLabel));
      }
      list.appendChild(li);
    }

    if (event.origin === 'local') {
      const li = document.createElement('li');
      li.innerHTML = '<strong>Note:</strong> Added via submission form';
      list.appendChild(li);
    }

    return list;
  }

  function buildTimelineRow(event) {
    const row = document.createElement('div');
    row.className = 'row timeline-row';
    if (event.yearDisplay) {
      row.dataset.year = event.yearDisplay;
    }
    if (event.monthPadded) {
      row.dataset.month = event.monthPadded;
    }
    if (event.type) {
      row.dataset.type = event.type;
    }

    const yearCol = document.createElement('div');
    yearCol.className = 'col-2 fw-bold';
    yearCol.textContent = event.yearDisplay || '—';

    const dateCol = document.createElement('div');
    dateCol.className = 'col-2 text-center';
    if (event.monthName) {
      const monthDiv = document.createElement('div');
      monthDiv.textContent = event.monthName;
      dateCol.appendChild(monthDiv);
      if (event.day) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'fw-bold fs-5';
        dayDiv.textContent = event.day;
        dateCol.appendChild(dayDiv);
      } else if (event.displayDate && event.displayDate !== event.monthName) {
        const textDiv = document.createElement('div');
        textDiv.textContent = event.displayDate;
        dateCol.appendChild(textDiv);
      }
    } else if (event.displayDate) {
      const displayDiv = document.createElement('div');
      displayDiv.textContent = event.displayDate;
      dateCol.appendChild(displayDiv);
    }

    const timelineCol = document.createElement('div');
    timelineCol.className = 'col-1 timeline-col';
    timelineCol.innerHTML = '<div class="timeline-line"></div><div class="timeline-dot"></div>';

    const eventCol = document.createElement('div');
    eventCol.className = 'col-7 timeline-event';

    const preview = document.createElement('div');
    preview.className = 'timeline-preview';
    const previewTitle = document.createElement('h2');
    previewTitle.className = 'h5 mb-1';
    previewTitle.textContent = event.title || 'Untitled event';
    preview.appendChild(previewTitle);
    const previewSummary = document.createElement('p');
    previewSummary.className = 'mb-0';
    const previewText = event.summary || event.type || event.sourceLabel || '';
    if (previewText) {
      previewSummary.textContent = previewText;
      preview.appendChild(previewSummary);
    }

    const card = document.createElement('div');
    card.className = 'card timeline-card';
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    const textArea = document.createElement('div');
    textArea.className = 'card-text-area';

    const cardTitle = document.createElement('h2');
    cardTitle.className = 'h5';
    cardTitle.textContent = event.title || 'Untitled event';
    textArea.appendChild(cardTitle);

    if (event.summary) {
      const summaryParagraph = document.createElement('p');
      summaryParagraph.textContent = event.summary;
      textArea.appendChild(summaryParagraph);
    } else if (event.type || event.sourceLabel) {
      const summaryParagraph = document.createElement('p');
      const fragments = [];
      if (event.type) {
        fragments.push(event.type);
      }
      if (event.sourceLabel) {
        fragments.push(`Source: ${event.sourceLabel}`);
      }
      summaryParagraph.textContent = fragments.join(' \u2014 ');
      textArea.appendChild(summaryParagraph);
    } else {
      const placeholder = document.createElement('p');
      placeholder.className = 'text-muted';
      placeholder.textContent = 'No additional summary provided.';
      textArea.appendChild(placeholder);
    }

    textArea.appendChild(buildMetaList(event));
    cardBody.appendChild(textArea);

    if (event.imageData) {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-wrapper';
      const img = document.createElement('img');
      img.src = event.imageData;
      img.alt = 'Submitted event image';
      wrapper.appendChild(img);
      cardBody.appendChild(wrapper);
    }

    card.appendChild(cardBody);
    eventCol.appendChild(preview);
    eventCol.appendChild(card);

    eventCol.addEventListener('click', (evt) => {
      if (evt.target.closest('a')) {
        return;
      }
      const isActive = row.classList.contains('active');
      document.querySelectorAll('#timeline .timeline-row.active').forEach((openRow) => {
        if (openRow !== row) {
          openRow.classList.remove('active');
        }
      });
      if (isActive) {
        row.classList.remove('active');
      } else {
        row.classList.add('active');
      }
    });

    row.appendChild(yearCol);
    row.appendChild(dateCol);
    row.appendChild(timelineCol);
    row.appendChild(eventCol);

    return row;
  }

  function renderTimeline(events) {
    clearTimeline();
    if (!events.length) {
      renderEmptyState();
      return;
    }
    events.forEach((event) => {
      timelineContainer.appendChild(buildTimelineRow(event));
    });
  }

  function populateYearFilter(events) {
    if (!yearSelect) {
      return;
    }
    const currentValue = yearSelect.value;
    while (yearSelect.options.length > 1) {
      yearSelect.remove(1);
    }
    const years = Array.from(new Set(events
      .map((event) => event.yearDisplay)
      .filter((value) => value)));
    years.sort((a, b) => {
      const aNum = parseInt(a, 10);
      const bNum = parseInt(b, 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return bNum - aNum;
      }
      return String(b).localeCompare(String(a));
    });
    years.forEach((year) => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
    if (currentValue && years.includes(currentValue)) {
      yearSelect.value = currentValue;
    } else {
      yearSelect.value = '';
    }
  }

  function populateMonthFilter(events) {
    if (!monthSelect) {
      return;
    }
    const currentValue = monthSelect.value;
    while (monthSelect.options.length > 1) {
      monthSelect.remove(1);
    }
    const monthMap = new Map();
    events.forEach((event) => {
      if (event.monthPadded && event.monthName && !monthMap.has(event.monthPadded)) {
        monthMap.set(event.monthPadded, event.monthName);
      }
    });
    Array.from(monthMap.entries())
      .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
      .forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        monthSelect.appendChild(option);
      });
    if (currentValue && monthMap.has(currentValue)) {
      monthSelect.value = currentValue;
    } else {
      monthSelect.value = '';
    }
  }

  function populateTypeSummary(events) {
    if (!typeList) {
      return;
    }
    typeList.innerHTML = '';
    const counts = new Map();
    events.forEach((event) => {
      if (!event.type) {
        return;
      }
      const key = event.type.trim();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    if (!counts.size) {
      typeList.classList.add('d-none');
      return;
    }
    typeList.classList.remove('d-none');
    Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1] === a[1]) {
          return a[0].localeCompare(b[0]);
        }
        return b[1] - a[1];
      })
      .forEach(([type, count]) => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex flex-column';
        const label = document.createElement('span');
        label.textContent = type;
        const badge = document.createElement('span');
        badge.className = 'small text-muted';
        badge.textContent = `${count} item${count === 1 ? '' : 's'}`;
        item.appendChild(label);
        item.appendChild(badge);
        typeList.appendChild(item);
      });
  }

  function applyFilters() {
    const yearFilter = yearSelect ? yearSelect.value : '';
    const monthFilter = monthSelect ? monthSelect.value : '';
    const filtered = state.events.filter((event) => {
      const matchesYear = !yearFilter || String(event.yearDisplay) === yearFilter;
      const matchesMonth = !monthFilter || event.monthPadded === monthFilter;
      return matchesYear && matchesMonth;
    });
    renderTimeline(filtered);
  }

  function setupFilters() {
    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilters);
    }
    if (monthSelect) {
      monthSelect.addEventListener('change', applyFilters);
    }
  }

  function initialise() {
    setMessage('Loading timeline entries…', 'info');
    DataLoader.loadTimelineEvents()
      .then((events) => {
        state.events = events;
        populateYearFilter(events);
        populateMonthFilter(events);
        populateTypeSummary(events);
        applyFilters();
        setMessage('', 'info');
      })
      .catch(() => {
        setMessage('Unable to load timeline entries right now. Saved form submissions will still appear once data is available.', 'danger');
        renderTimeline([]);
      });
    setupFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise);
  } else {
    initialise();
  }
})();
