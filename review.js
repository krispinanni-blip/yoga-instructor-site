/* מצב הערות: נפתח רק בקישור עם ?review=1. מבקרים רגילים לא רואים כלום. */
(function () {
  var KEY = 'hadarReview', NOTES = 'hadarNotes';
  var on = false;
  try {
    var q = new URLSearchParams(location.search).get('review');
    if (q === '1') sessionStorage.setItem(KEY, '1');
    if (q === '0') { sessionStorage.removeItem(KEY); }
    on = sessionStorage.getItem(KEY) === '1';
  } catch (e) { on = new URLSearchParams(location.search).get('review') === '1'; }
  if (!on) return;

  function load() { try { return JSON.parse(localStorage.getItem(NOTES)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(NOTES, JSON.stringify(list)); } catch (e) {} }
  var notes = load();
  var picking = false, hovered = null;

  var css = document.createElement('style');
  css.textContent =
    '#rv-bar,#rv-bar *,#rv-dlg,#rv-dlg *{box-sizing:border-box;font-family:Heebo,Arial,sans-serif;direction:rtl}' +
    '#rv-bar{position:fixed;inset-inline:12px;bottom:12px;z-index:99999;background:#2b2722;color:#f0e7d6;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.3)}' +
    '#rv-bar button{font:inherit;background:transparent;color:#f0e7d6;border:1px solid #8a6a45;padding:6px 14px;cursor:pointer}' +
    '#rv-bar button.on{background:#8a6a45}' +
    '#rv-bar .rv-sp{flex:1}' +
    '#rv-dlg{position:fixed;inset:0;z-index:100000;background:rgba(43,39,34,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#rv-dlg .rv-box{background:#f0eae0;color:#3b352e;width:min(480px,100%);max-height:90vh;overflow:auto;padding:22px}' +
    '#rv-dlg h3{margin:0 0 6px;font-size:18px}' +
    '#rv-dlg .rv-ctx{font-size:13px;color:#696159;margin:0 0 12px;word-break:break-word}' +
    '#rv-dlg textarea{width:100%;min-height:110px;font:inherit;padding:8px;border:1px solid #8a6a45;background:#fff;color:#3b352e}' +
    '#rv-dlg .rv-row{display:flex;gap:8px;margin-top:12px}' +
    '#rv-dlg button{font:inherit;padding:8px 16px;cursor:pointer;border:1px solid #3b352e;background:transparent;color:#3b352e}' +
    '#rv-dlg button.pri{background:#3b352e;color:#f0eae0}' +
    '#rv-dlg ol{padding-inline-start:20px;margin:0}' +
    '#rv-dlg li{margin-bottom:12px;font-size:14px}' +
    '#rv-dlg li small{display:block;color:#696159}' +
    '.rv-hover{outline:2px dashed #8a6a45!important;outline-offset:2px;cursor:crosshair!important}' +
    'body{padding-bottom:70px}';
  document.head.appendChild(css);

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }
  function inUi(n) { return n && n.closest && (n.closest('#rv-bar') || n.closest('#rv-dlg')); }

  var bar = el('div', { id: 'rv-bar' });
  var label = el('span', null, 'מצב הערות');
  var pickBtn = el('button', { type: 'button' }, 'הוספת הערה');
  var listBtn = el('button', { type: 'button' });
  var sendBtn = el('button', { type: 'button' }, 'שליחה לאנני');
  var exitBtn = el('button', { type: 'button' }, 'יציאה');
  bar.appendChild(label); bar.appendChild(pickBtn); bar.appendChild(listBtn);
  bar.appendChild(el('span', { 'class': 'rv-sp' })); bar.appendChild(sendBtn); bar.appendChild(exitBtn);
  document.body.appendChild(bar);

  function refresh() {
    listBtn.textContent = 'ההערות שלי (' + notes.length + ')';
    pickBtn.className = picking ? 'on' : '';
    pickBtn.textContent = picking ? 'לחצי על מה שרוצים לשנות (ביטול)' : 'הוספת הערה';
  }
  refresh();

  function snippet(n) {
    var t = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 70 ? t.slice(0, 70) + '…' : t;
  }
  function heading(n) {
    var s = n.closest('section,header,footer,article') || document.body;
    var h = s.querySelector('h1,h2,h3');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function pageName() { return (document.title || '').split('|')[0].trim() || location.pathname; }

  function closeDlg() { var d = document.getElementById('rv-dlg'); if (d) d.remove(); }
  function openDlg(content) {
    closeDlg();
    var d = el('div', { id: 'rv-dlg' }), b = el('div', { 'class': 'rv-box' });
    b.appendChild(content); d.appendChild(b); document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) closeDlg(); });
  }

  function addNote(target) {
    var box = el('div');
    box.appendChild(el('h3', null, 'מה לשנות?'));
    var ctx = (heading(target) ? 'בחלק "' + heading(target) + '": ' : '') + '"' + snippet(target) + '"';
    box.appendChild(el('p', { 'class': 'rv-ctx' }, ctx));
    var ta = el('textarea', { placeholder: 'כתבי כאן מה לשנות, להוסיף או להסיר' });
    box.appendChild(ta);
    var row = el('div', { 'class': 'rv-row' });
    var ok = el('button', { type: 'button', 'class': 'pri' }, 'שמירה');
    var no = el('button', { type: 'button' }, 'ביטול');
    row.appendChild(ok); row.appendChild(no); box.appendChild(row);
    ok.addEventListener('click', function () {
      var v = ta.value.trim();
      if (v) {
        notes.push({ page: pageName(), file: location.pathname.split('/').pop() || 'index.html', where: heading(target), text: snippet(target), note: v });
        save(notes); refresh();
      }
      closeDlg();
    });
    no.addEventListener('click', closeDlg);
    openDlg(box); ta.focus();
  }

  function noteText() {
    if (!notes.length) return '';
    return 'הערות לאתר של הדר:\n\n' + notes.map(function (n, i) {
      return (i + 1) + '. עמוד: ' + n.page + (n.where ? ' / חלק: ' + n.where : '') + '\n   על: "' + n.text + '"\n   לשנות: ' + n.note;
    }).join('\n\n');
  }

  function showList() {
    var box = el('div');
    box.appendChild(el('h3', null, 'ההערות שלי'));
    if (!notes.length) box.appendChild(el('p', { 'class': 'rv-ctx' }, 'עוד אין הערות. לחצי על "הוספת הערה" ובחרי מה לשנות.'));
    var ol = el('ol');
    notes.forEach(function (n, i) {
      var li = el('li');
      li.appendChild(el('small', null, n.page + (n.where ? ' / ' + n.where : '')));
      li.appendChild(el('span', null, n.note));
      var del = el('button', { type: 'button' }, 'מחיקה');
      del.style.marginInlineStart = '8px';
      del.addEventListener('click', function () { notes.splice(i, 1); save(notes); refresh(); showList(); });
      li.appendChild(del);
      ol.appendChild(li);
    });
    box.appendChild(ol);
    var row = el('div', { 'class': 'rv-row' });
    var close = el('button', { type: 'button', 'class': 'pri' }, 'סגירה');
    close.addEventListener('click', closeDlg);
    row.appendChild(close); box.appendChild(row);
    openDlg(box);
  }

  function send() {
    var t = noteText();
    if (!t) { showList(); return; }
    try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch (e) {}
    var box = el('div');
    box.appendChild(el('h3', null, 'שליחה לאנני'));
    box.appendChild(el('p', { 'class': 'rv-ctx' }, 'ההערות הועתקו. בלחיצה על הכפתור ייפתח וואטסאפ, ושם בוחרים את אנני ולוחצים "שלח".'));
    var row = el('div', { 'class': 'rv-row' });
    var go = el('button', { type: 'button', 'class': 'pri' }, 'פתיחת וואטסאפ');
    var done = el('button', { type: 'button' }, 'ניקוי ההערות אחרי שליחה');
    row.appendChild(go); row.appendChild(done); box.appendChild(row);
    go.addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); });
    done.addEventListener('click', function () { notes = []; save(notes); refresh(); closeDlg(); });
    openDlg(box);
  }

  pickBtn.addEventListener('click', function () {
    picking = !picking;
    if (!picking && hovered) { hovered.classList.remove('rv-hover'); hovered = null; }
    refresh();
  });
  listBtn.addEventListener('click', showList);
  sendBtn.addEventListener('click', send);
  exitBtn.addEventListener('click', function () {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    location.href = location.pathname;
  });

  document.addEventListener('mouseover', function (e) {
    if (!picking || inUi(e.target)) return;
    if (hovered) hovered.classList.remove('rv-hover');
    hovered = e.target; hovered.classList.add('rv-hover');
  });
  document.addEventListener('click', function (e) {
    if (!picking || inUi(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var t = e.target;
    if (hovered) hovered.classList.remove('rv-hover');
    hovered = null; picking = false; refresh();
    addNote(t);
  }, true);
})();
