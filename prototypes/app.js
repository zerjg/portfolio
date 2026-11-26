const params = new URLSearchParams(location.search);
const project = Object.hasOwn(platforms, params.get('p')) ? params.get('p') : 'cifra';
const platform = platforms[project];
const screenIndex = Number(params.get('screen') || 1) - 1;
const current = platform.screens[screenIndex] ? screenIndex : 0;
const [title, description, period, layout, ...content] = platform.screens[current];
const colorNames = 'accent sidebar nav brand navline active soft canvas ink line muted selected radius'.split(' ');
colorNames.forEach((name, i) => document.body.style.setProperty('--' + name, platform.colors[i]));
document.title = title + ' · ' + platform.brand;

const sidebar = document.getElementById('sidebar');
sidebar.innerHTML = `
  <div class="brand"><span class="logo" aria-hidden="true">${platform.logo}</span>${platform.brand}</div>
  <div class="context">${platform.context}<small>Рабочая область</small></div>
  <nav aria-label="Разделы платформы"><small>${platform.area}</small>${platform.screens.map(([label], index) =>
    `<a href="?p=${project}&screen=${index + 1}" ${index === current ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${'▥ ≡ ◇ ▤ ▦ ⊞'.split(' ')[index]}</span>${label}</a>`).join('')}
  </nav>
  <div class="profile"><span class="avatar">${platform.avatar}</span><div>${platform.person}<small>${platform.role}</small></div></div>`;
document.getElementById('topbar').innerHTML = `<span>${platform.area} &nbsp; / &nbsp; <b>${title}</b></span><div class="top-actions"><span>Демонстрационные данные</span><a href="../project.html?p=${project}">К проекту ↗</a></div>`;

function panel(title, content, subtitle = '', extra = '') {
  return `<section class="panel"><div class="panel-head"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${extra}</div>${content}</section>`;
}

function metrics(items) {
  return `<div class="metrics">${items.map(item => {
    const [label, value, note] = item.split('|');
    return `<div class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
  }).join('')}</div>`;
}

function table([title, head, ...rows], filterOptions = [], showSearch = true) {
  const fields = head.split('|');
  const filters = `<div class="filters"><input type="search" aria-label="Поиск по таблице" placeholder="Поиск по таблице">${filterOptions.map(option =>
    `<button type="button" class="pill" data-filter="${option}" aria-pressed="false">${option}</button>`).join('')}</div>`;
  return panel(title, (showSearch ? filters : '') + `<div class="table-wrap"><table><thead><tr>${fields.map(field => `<th scope="col">${field}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.split('|').map((cell, i) => {
      const state = { '+': '', '~': 'info', '!': 'wait' };
      if (i === 0) return `<td><button class="record">${cell}</button></td>`;
      if (Object.hasOwn(state, cell[0])) return `<td><span class="status ${state[cell[0]]}">${cell.slice(1)}</span></td>`;
      return `<td>${cell}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div><p class="note" aria-live="polite">Показано ${rows.length} из ${rows.length}</p>`);
}

function chart([heading, labels, actual, plan]) {
  const [title, unit, scale = '100', comparison = 'План'] = heading.split('|');
  const max = Number(scale);
  const values = actual.split(',').map(Number);
  const reference = plan.split(',').map(Number);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map(ratio => (max * ratio).toLocaleString('ru'));
  return panel(title, `<div class="plot" role="img" aria-label="${title}">
    <div class="plot-labels">${ticks.map(x => `<span>${x}</span>`).join('')}</div>
    <div class="bars">${labels.split(',').map((label, i) => `<div class="bar-group"><div class="bar-track">
      <div class="bar plan" style="height:${100 * reference[i] / max}%"></div><div class="bar" style="height:${100 * values[i] / max}%"></div>
      </div><span>${label}</span></div>`).join('')}</div></div>`, unit, `<span class="legend">■ Факт &nbsp; ▫ ${comparison}</span>`);
}

function breakdown([title, ...items]) {
  return panel(title, `<div class="breakdown">${items.map(item => {
    const [name, value, progress] = item.split('|');
    return `<div><span>${name}</span><b>${value}</b><meter max="100" value="${progress}" aria-label="${name}"></meter></div>`;
  }).join('')}</div>`);
}

function timeline([title, ...items]) {
  return panel(title, `<div class="timeline">${items.map(item => {
    const [time, name, info] = item.split('|');
    return `<div><time>${time}</time><span>${name}<small>${info}</small></span></div>`;
  }).join('')}</div>`);
}

function map(title) {
  const isFactory = project === 'cifra';
  const labels = isFactory ? ['Завод № 1', 'Северный квартал', 'Логопарк Восток'] : ['Центральный округ', 'Северный округ', 'Приволжский округ'];
  return panel(title, `<div class="map">
    <svg viewBox="0 0 650 235" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${title}">
      <defs><pattern id="streets" width="48" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
      <rect x="4" y="4" width="38" height="28" rx="4" fill="#e1ebe0"/><path d="M0 0H48M0 0V38" stroke="#fff" stroke-width="4"/></pattern></defs>
      <rect width="650" height="235" fill="url(#streets)"/>
      <path d="M-20 198Q102 109 216 183T437 147T660 32" fill="none" stroke="#bddbea" stroke-width="28"/>
      <path d="M-10 66Q130 94 249 49L648 173M217 242L268 101L381 -10M0 154L147 111L657 94" fill="none" stroke="#fff" stroke-width="7"/>
      ${isFactory ? '<path d="M104 150L183 124L230 132L267 93L330 61L448 101L512 143" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>' : ''}
      ${[[104,150],[330,61],[512,143]].map(([x,y], i) => `<g transform="translate(${x} ${y})"><circle r="10" fill="var(--accent)" stroke="white" stroke-width="3"/><text x="14" y="-11" font-size="11" fill="#233644" stroke="white" stroke-width="3" paint-order="stroke">${labels[i]}</text></g>`).join('')}
    </svg><span class="label pill">● ${isFactory ? 'Машины на линии' : 'Объекты мониторинга'}</span></div>`);
}

const renderers = {
  dashboard: ([summary, activity, distribution, register]) => metrics(summary) +
    `<div class="split">${chart(activity)}${breakdown(distribution)}</div>` + table(register, [], false),
  table: ([summary, register]) => metrics(summary) + table(register),
  search: ([summary, results]) => metrics(summary) + table(results, ['44-ФЗ', '223-ФЗ']),
  map: ([[title, ...events], register]) => `<div class="split">${map(title)}${timeline(events)}</div>` + table(register, [], false),
  detail: ([summary, fields, events]) => metrics(summary) + `<div class="split">${table(fields, [], false)}${timeline(events)}</div>`
};
const workspace = document.getElementById('workspace');
workspace.innerHTML = `<div class="heading"><div><h1>${title}</h1><p>${description}</p></div><span class="pill">${period}</span></div>` + renderers[layout](content);

document.querySelectorAll('.panel').forEach(section => {
  const input = section.querySelector('input[type="search"]');
  const rows = [...section.querySelectorAll('tbody tr')];
  const filterButtons = [...section.querySelectorAll('[data-filter]')];
  function updateRows() {
    const query = input.value.trim().toLocaleLowerCase('ru');
    const law = filterButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.filter;
    rows.forEach(row => {
      row.hidden = !row.textContent.toLocaleLowerCase('ru').includes(query) || Boolean(law && row.lastElementChild.textContent !== law);
    });
    section.querySelector('.note').textContent = 'Показано ' + rows.filter(row => !row.hidden).length + ' из ' + rows.length;
  }
  input?.addEventListener('input', updateRows);
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button && !pressed)));
    updateRows();
  }));
  const dialog = document.getElementById('detail');
  const detail = document.getElementById('detail-content');
  const headers = [...section.querySelectorAll('th')];
  rows.forEach(row => row.querySelector('button.record').addEventListener('click', () => {
    const [first, ...fields] = [...row.cells];
    const heading = document.createElement('h2');
    heading.id = 'detail-title';
    heading.textContent = first.textContent;
    const data = document.createElement('dl');
    fields.forEach((field, index) => {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = headers[index + 1].textContent;
      value.textContent = field.textContent;
      data.append(term, value);
    });
    detail.replaceChildren(heading, data);
    dialog.setAttribute('aria-labelledby', heading.id);
    dialog.showModal();
  }));
});
