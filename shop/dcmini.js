/* Minimal renderer for the shop mockup templates: {{ path }}, sc-for, sc-if, dc-import, onClick handlers. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) { Object.assign(this.state, p); if (this.__rerender) this.__rerender(); }
    renderVals() { return {}; }
  }

  const defs = {};
  const RE = /\{\{\s*([^}]*?)\s*\}\}/g;

  function get(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  }
  function whole(v) { const m = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/.exec(v || ''); return m ? m[1] : null; }
  function interp(str, scope) { return str.replace(RE, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); }); }

  async function load(base, name) {
    if (defs[name]) return defs[name];
    const res = await fetch(base + name + '.dc.html');
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const x = doc.querySelector('x-dc');
    const helmet = x.querySelector('helmet');
    const head = [];
    if (helmet) { [...helmet.childNodes].forEach(n => head.push(n)); helmet.remove(); }
    const s = doc.querySelector('script[data-dc-script]');
    const Comp = s ? new Function('DCLogic', s.textContent + '\nreturn Component;')(DCLogic) : DCLogic;
    const def = { x, head, Comp };
    defs[name] = def;
    for (const imp of x.querySelectorAll('dc-import')) await load(base, imp.getAttribute('name'));
    return def;
  }

  function renderInto(parent, nodes, scope) {
    for (const n of nodes) {
      if (n.nodeType === 3) { parent.appendChild(document.createTextNode(interp(n.textContent, scope))); continue; }
      if (n.nodeType !== 1) continue;
      const tag = n.tagName.toLowerCase();
      if (tag === 'sc-for') {
        const list = get(scope, whole(n.getAttribute('list'))) || [];
        const as = n.getAttribute('as');
        list.forEach(item => renderInto(parent, n.childNodes, Object.assign(Object.create(scope), { [as]: item })));
        continue;
      }
      if (tag === 'sc-if') {
        if (get(scope, whole(n.getAttribute('value')))) renderInto(parent, n.childNodes, scope);
        continue;
      }
      if (tag === 'dc-import') {
        const props = {};
        for (const a of n.attributes) {
          if (a.name === 'name' || a.name.startsWith('hint-')) continue;
          const w = whole(a.value);
          props[a.name] = w ? get(scope, w) : a.value;
        }
        mount(parent, defs[n.getAttribute('name')], props);
        continue;
      }
      const out = n.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(tag) : document.createElementNS(n.namespaceURI, n.tagName);
      for (const a of n.attributes) {
        if (a.name.startsWith('hint-')) continue;
        if (/^on[a-z]+$/i.test(a.name) && whole(a.value)) {
          const fn = get(scope, whole(a.value));
          if (typeof fn === 'function') out.addEventListener(a.name.slice(2).toLowerCase(), fn);
          continue;
        }
        out.setAttribute(a.name, interp(a.value, scope));
      }
      renderInto(out, n.childNodes, scope);
      parent.appendChild(out);
    }
  }

  function mount(parent, def, props) {
    const inst = new def.Comp(props);
    const start = document.createComment('dc'), end = document.createComment('/dc');
    parent.appendChild(start);
    const draw = () => {
      let n = start.nextSibling;
      while (n && n !== end) { const nx = n.nextSibling; n.remove(); n = nx; }
      const frag = document.createDocumentFragment();
      renderInto(frag, def.x.childNodes, inst.renderVals());
      end.parentNode.insertBefore(frag, end);
    };
    parent.appendChild(end);
    inst.__rerender = draw;
    draw();
  }

  window.dcRender = async function (base, page, target) {
    const def = await load(base, page);
    target.textContent = '';
    mount(target, def, {});
  };
  window.dcHeads = function () {
    const seen = new Set(), out = [];
    Object.values(defs).forEach(d => d.head.forEach(n => {
      if (n.nodeType !== 1) return;
      const h = n.outerHTML; if (!seen.has(h)) { seen.add(h); out.push(h); }
    }));
    return out;
  };

  const me = document.currentScript;
  if (me && me.dataset.page) {
    const go = () => dcRender(me.dataset.base || '', me.dataset.page, document.getElementById(me.dataset.target || 'app'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})();
