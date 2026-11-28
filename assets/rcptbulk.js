/* Many receipts at once from Excel, on receipt.niveshsahayak.in (payments received) and fee-receipt.niveshsahayak.in (student fees)
   (byof2-receipts, 28 Nov 2026).
   Step 1: your business, the date / month / mode for rows that leave them empty, paper, the first receipt number, the list (Excel or CSV,
   any headings, or Try with sample files).
   Step 2: what was read, the columns used (changeable, remembered for the next file with the same headings), problems row by row.
   Step 3: every receipt as one PDF (one per page), one PDF each (zip), Print all, the receipts register (Excel), the messages sheet,
   and a WhatsApp / email message to each payer one after another (the visitor presses Send in WhatsApp or the mail app: nothing is
   sent from here). Receipts are drawn with the site's own printed sheet (slip.js / fee.js NSRcptOut), numbers count on in the site's
   own series and never repeat a saved receipt's number. Nothing leaves the browser, and the receipts are NOT saved to NSBiz.
   Screen words: NS.t('rb.*') (English only for now); files and printed receipts are in English.
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var RB = window.NSRcptBulk;
  var SHEETJS = '/assets/vendor/xlsx-0.20.3.full.min.js';
  function L(k, v) { return NS.t('rb.' + k, v); }
  var ST = { book: null, fileName: '', force: null, lines: [], D: null, sample: false, bizes: [], ser: null, kind: '', sent: {} };
  function K() { return ST.kind; }
  function OUT() { return window.NSRcptOut; }
  var LKEY = function () { return 'ns-rcptbulk-layouts-' + K(); }, SKEY = function () { return 'ns-rcptbulk-set-' + K(); };
  function lastKey(head) { return 'ns-rcptbulk-last|' + K() + '|' + head; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function money(n) { return NS.money(n, false); }
  function save(blob, name) { if (NS.saveFile) NS.saveFile(blob, name); else { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); } NS.toast(L('saved', { f: name })); }
  function setOf() { return Object.assign({ mode: 'cash', paper: (OUT() || {}).paper || 'a5', gst: 'ex', incl: true, wa: 'auto', copy: false }, get(SKEY(), {})); }

  /* ---------- the section ---------- */
  function html() {
    var fee = K() === 'fee', m = NS.today().slice(0, 7);
    var modes = [['cash', L('m_cash')], ['upi', 'UPI'], ['cheque', L('m_cheque')], ['bank', L('m_bank')], ['card', L('m_card')], ['dd', L('m_dd')]].map(function (x) { return '<option value="' + x[0] + '">' + esc(x[1]) + '</option>'; }).join('');
    return '<h2 id="rb-h">' + esc(L(fee ? 'h_fee' : 'h_pay')) + '</h2><p>' + esc(L(fee ? 'lead_fee' : 'lead_pay')) + '</p><p class="soft">' + esc(L('private')) + '</p>' +
      '<div class="bk-steps">' +
      '<div class="card"><h3>' + esc(L('s1')) + '</h3>' +
        '<div class="rb-f"><label>' + esc(L(fee ? 'biz_fee' : 'biz')) + '<select id="rb-biz"><option value="">' + esc(L('biz_typed')) + '</option></select></label>' +
        '<label>' + esc(L('bname')) + '<input id="rb-bname" autocomplete="organization"></label>' +
        '<label>' + esc(L('baddr')) + '<input id="rb-baddr" autocomplete="street-address"></label>' +
        '<label>' + esc(L('bphone')) + '<input id="rb-bphone" inputmode="tel" dir="ltr"></label>' +
        (fee ? '' : '<label>' + esc(L('bgstin')) + '<input id="rb-bgstin" dir="ltr" maxlength="15"></label>') +
        '<label>' + esc(L('date')) + '<input type="date" id="rb-date" value="' + NS.today() + '"></label>' +
        (fee ? '<label>' + esc(L('month')) + '<input type="month" id="rb-month" value="' + m + '"></label>' : '') +
        '<label>' + esc(L('mode')) + '<select id="rb-mode">' + modes + '</select></label>' +
        '<label>' + esc(L('paper')) + '<select id="rb-paper"><option value="a5">A5</option><option value="a4">A4</option></select></label>' +
        (fee ? '<label>' + esc(L('gst')) + '<select id="rb-gst"><option value="ex">' + esc(L('g_ex')) + '</option><option value="18">' + esc(L('g_18')) + '</option><option value="none">' + esc(L('g_none')) + '</option></select></label>' : '') +
        '<label>' + esc(L('start')) + '<span class="rb-no"><span id="rb-head" class="mono"></span><input id="rb-start" type="number" min="1" step="1" inputmode="numeric"></span></label></div>' +
        (fee ? '<label class="chk"><input type="checkbox" id="rb-incl" checked> ' + esc(L('incl')) + '</label>' : '') +
        '<label class="chk"><input type="checkbox" id="rb-copy"> ' + esc(L('copy')) + '</label>' +
        '<p class="soft" id="rb-nonote"></p>' +
        '<div class="row"><label class="btn primary" for="rb-file">' + esc(L('choose')) + '</label><input type="file" id="rb-file" accept=".xlsx,.xls,.csv,.txt" hidden>' +
        '<button type="button" class="btn" data-rb="sample">' + esc(L('try')) + '</button><button type="button" class="btn sm" data-rb="template">' + esc(L('tpl')) + '</button></div>' +
        '<div class="rb-drop" id="rb-drop" tabindex="0" role="button">' + esc(L('drop')) + '</div>' +
        '<p class="soft" id="rb-files"></p></div>' +
      '<div class="card" id="rb-s2" hidden><h3>' + esc(L('s2')) + '</h3><div class="bk-out" id="rb-read"></div></div>' +
      '<div class="card" id="rb-s3" hidden><h3>' + esc(L('s3')) + '</h3><div class="bk-out" id="rb-out"></div></div>' +
      '</div>';
  }
  function box() {
    var b = $('[data-rcptbulk]');
    if (!b) {
      var tool = $('#tool'); if (!tool) return null;
      b = document.createElement('section'); b.className = 'bulk wrap'; b.id = 'bulk'; b.setAttribute('data-rcptbulk', K());
      tool.parentNode.insertBefore(b, tool.nextSibling);
    }
    b.setAttribute('aria-labelledby', 'rb-h');
    return b;
  }

  /* ---------- reading files ---------- */
  function readBook(file) {
    var name = String(file.name || ''), csv = /\.(csv|txt)$/i.test(name);
    function plain() { return NS.xlsx.read(file).then(function (rows) { return [{ name: name.replace(/\.[^.]+$/, '') || 'Sheet1', rows: rows }]; }); }
    if (csv) return plain();
    return NS.loadJs(SHEETJS).then(function () {
      return file.arrayBuffer().then(function (buf) {
        var X = window.XLSX, wb = X.read(buf, { type: 'array', cellDates: false });
        return wb.SheetNames.map(function (n) { return { name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' }).map(function (r) { return r.map(function (c) { return String(c == null ? '' : c).trim(); }); }).filter(function (r) { return r.some(Boolean); }) }; });
      });
    }, plain);
  }
  function takeFile(file) {
    if (!file) return;
    return readBook(file).then(function (book) { ST.book = book; ST.fileName = file.name; ST.force = null; ST.sample = false; ST.sent = {}; run(); },
      function (e) { NS.toast(String(e && e.message) === 'xls' ? L('err_xls') : L('err_read'), 'bad'); });
  }

  /* ---------- the number series ---------- */
  function seller() {
    var id = $('#rb-biz').value, b = ST.bizes.filter(function (x) { return x.id === id; })[0];
    var s = b ? Object.assign({}, b) : {};
    var n = $('#rb-bname').value.trim(), a = $('#rb-baddr').value.trim(), p = $('#rb-bphone').value.trim(), g = $('#rb-bgstin') ? $('#rb-bgstin').value.trim().toUpperCase() : '';
    if (n) s.name = n; if (a) s.addr = a; if (p) s.phone = p; if (g) s.gstin = g;
    delete s.id; delete s.created; delete s.updated;
    return s;
  }
  /* the series head and the first free number (saved receipts of this business and year, and the last bulk run here) */
  function series() {
    var O = OUT(); if (!O || !window.NSStore) return Promise.resolve(null);
    return O.next(seller(), $('#rb-date').value || NS.today()).then(function (x) {
      var last = +get(lastKey(x.head), 0) || 0;
      ST.ser = { head: x.head, width: x.width, n: Math.max(x.n, last + 1), used: x.used || [], manual: x.manual };
      $('#rb-head').textContent = x.head;
      var inp = $('#rb-start'); if (!inp.dataset.typed) inp.value = ST.ser.n;
      $('#rb-nonote').textContent = L('nonote', { no: x.head + String(ST.ser.n).padStart(x.width, '0'), n: ST.ser.used.length });
      return ST.ser;
    }, function () { return null; });
  }

  /* ---------- working out ---------- */
  function opts() {
    var s = ST.ser || { head: (OUT() || {}).prefix ? OUT().prefix + '/' : '', width: K() === 'fee' ? 4 : 3, used: [] };
    return { kind: K(), date: $('#rb-date').value, month: $('#rb-month') ? $('#rb-month').value : '', mode: $('#rb-mode').value, gst: $('#rb-gst') ? $('#rb-gst').value : 'ex',
      incl: $('#rb-incl') ? $('#rb-incl').checked : true, head: s.head, width: s.width, start: +$('#rb-start').value || s.n || 1, used: s.used };
  }
  function prefs() { return { mode: $('#rb-mode').value, paper: $('#rb-paper').value, gst: $('#rb-gst') ? $('#rb-gst').value : 'ex', incl: $('#rb-incl') ? $('#rb-incl').checked : true, copy: $('#rb-copy').checked, wa: setOf().wa }; }
  function run() {
    put(SKEY(), prefs());
    $('#rb-files').textContent = ST.fileName ? L('file', { f: ST.fileName }) : '';
    if (!ST.book) return;
    ST.D = RB.read(ST.book, K(), { layouts: get(LKEY(), {}), force: ST.force });
    ST.lines = RB.work(ST.D.rows, opts());
    drawRead(); drawOut();
  }
  function msg(c) { return L('e_' + c[0], c[1] || {}); }
  function drawRead() {
    var D = ST.D, lines = ST.lines, f = D.found.filter(function (x) { return x.kind === K(); })[0], fee = K() === 'fee';
    var bad = lines.filter(function (l) { return !l.ok; }), ww = lines.filter(function (l) { return l.ok && l.warn.length; });
    var h = '';
    if (!f) { $('#rb-s2').hidden = false; $('#rb-read').innerHTML = '<p class="warn">' + esc(L(fee ? 'nosheet_fee' : 'nosheet_pay')) + '</p>'; $('#rb-s3').hidden = true; return; }
    h += '<p>' + esc(L('read', { n: lines.length, s: f.name, r: f.headRow + 1 })) + (ST.sample ? ' <b>' + esc(L('samplenote')) + '</b>' : '') + '</p>';
    if (fee) h += '<p>' + (f.feeCols && f.feeCols.length ? esc(L('heads', { l: f.feeCols.join(', ') })) : 'head' in f.map ? esc(L('headrows')) : esc(L('noheads'))) + '</p>';
    var joined = lines.filter(function (l) { return l.joined; });
    if (joined.length) h += '<p class="soft">' + esc(L('joined', { n: joined.length })) + '</p>';
    if (D.totals && D.totals.length) h += '<p class="soft">' + esc(L('totals', { l: D.totals.join(', ') })) + '</p>';
    var skipped = D.found.filter(function (x) { return x.kind !== K() && x.rows; });
    if (skipped.length) h += '<p class="soft">' + esc(L('otherSheets', { l: skipped.map(function (x) { return x.name; }).join(', ') })) + '</p>';
    if (D.probs.length) h += '<ul class="warn">' + D.probs.map(function (p) { return '<li>' + esc(L('nocol', { c: p.msg.replace(/^No column for |: choose it with Columns\.$/g, '') })) + '</li>'; }).join('') + '</ul>';
    if (lines.skipped) h += '<p class="soft">' + esc(L('skipno', { n: lines.skipped })) + '</p>';
    /* the columns used */
    var S = fee ? RB.FEE : RB.PAY, heads = f.heads || [], opt = function (sel) { return '<option value="">' + esc(L('col_none')) + '</option>' + heads.map(function (x, i) { return x ? '<option value="' + i + '"' + (sel === i ? ' selected' : '') + '>' + esc(x) + '</option>' : ''; }).join(''); };
    h += '<details class="rb-cols"' + (D.probs.length ? ' open' : '') + '><summary>' + esc(L('cols', { n: Object.keys(f.map).length })) + (f.remembered ? ' · ' + esc(L('remembered')) : '') + '</summary><div class="rb-colgrid">' +
      S.cols.map(function (c) { return '<label>' + esc(c.h) + (c.need ? ' *' : '') + '<select data-col="' + c.k + '">' + opt(f.map[c.k]) + '</select></label>'; }).join('') + '</div>' +
      '<p class="soft">' + esc(L(fee ? 'colhelp_fee' : 'colhelp')) + '</p><button type="button" class="btn sm" data-rb="remember">' + esc(L('rememberbtn')) + '</button></details>';
    var row = function (l) { return L('rowof', { r: l.row, n: l.name || '?' }); };
    if (bad.length) h += '<h4 class="warn">' + esc(L('errs', { n: bad.length })) + '</h4><ul class="warn">' + bad.map(function (l) { return '<li>' + esc(row(l)) + ': ' + esc(l.errs.map(msg).join('; ')) + '</li>'; }).join('') + '</ul>';
    if (ww.length) h += '<details' + (ww.length < 6 ? ' open' : '') + '><summary>' + esc(L('warns', { n: ww.length })) + '</summary><ul>' + ww.map(function (l) { return '<li>' + esc(row(l)) + ': ' + esc(l.warn.map(msg).join('; ')) + '</li>'; }).join('') + '</ul></details>';
    if (!bad.length) h += '<p class="ok">' + esc(L('allok')) + '</p>';
    var show = lines.slice(0, 300);
    h += '<div class="tbl"><table class="bk-t"><thead><tr><th>' + esc(L('t_row')) + '</th><th>' + esc(L('t_no')) + '</th><th>' + esc(L(fee ? 't_stu' : 't_name')) + '</th>' + (fee ? '<th>' + esc(L('t_cls')) + '</th><th>' + esc(L('t_period')) + '</th>' : '<th>' + esc(L('t_against')) + '</th>') + '<th>' + esc(L('t_mode')) + '</th><th>' + esc(L('t_date')) + '</th><th class="n">' + esc(L('t_amt')) + '</th>' + (fee ? '<th class="n">' + esc(L('t_bal')) + '</th>' : '') + '<th>' + esc(L('t_contact')) + '</th></tr></thead><tbody>' +
      show.map(function (l) { var d = l.d;
        return '<tr class="' + (l.ok ? 'ok' : 'bad') + '"><td>' + l.row + '</td><td class="mono">' + esc(d.no) + '</td><td>' + esc(l.name) + '</td>' +
          (fee ? '<td>' + esc(d.cls + (d.sec ? '-' + d.sec : '')) + '</td><td>' + esc(RB.period(d.mFrom, d.mTo)) + '</td>' : '<td>' + esc(d.against) + '</td>') +
          '<td>' + esc(modeName(d.mode)) + '</td><td>' + esc(NS.fmtDate(d.date)) + '</td><td class="n"><b>' + money(l.amt || 0) + '</b></td>' + (fee ? '<td class="n">' + (l.fee && l.fee.balance > 0 ? money(l.fee.balance) : '') + '</td>' : '') +
          '<td>' + (l.phone ? '<span class="mono">' + esc(l.phone) + '</span>' : '') + (l.email ? ' ✉' : '') + '</td></tr>'; }).join('') +
      '</tbody></table></div>' + (lines.length > show.length ? '<p class="soft">' + esc(L('more', { n: lines.length - show.length })) + '</p>' : '');
    $('#rb-s2').hidden = false; $('#rb-read').innerHTML = h;
  }
  function modeName(m) { return { cash: L('m_cash'), upi: 'UPI', cheque: L('m_cheque'), bank: L('m_bank'), card: L('m_card'), dd: L('m_dd') }[m] || L('m_other'); }
  function okLines() { return ST.lines.filter(function (l) { return l.ok; }); }
  function drawOut() {
    var ok = okLines();
    if (!ST.D || !ok.length) { $('#rb-s3').hidden = !ST.D; $('#rb-out').innerHTML = ST.D ? '<p class="warn">' + esc(L('nothing')) + '</p>' : ''; return; }
    var tot = ok.reduce(function (s, l) { return s + l.amt; }, 0), reach = ok.filter(function (l) { return l.phone || l.email; }).length;
    var first = ok[0].d.no, last = ok[ok.length - 1].d.no;
    var h = '<p>' + esc(L('ready', { n: ok.length, t: NS.money(tot), a: first, b: last })) + (ok.length < ST.lines.length ? ' <span class="warn">' + esc(L('leftout', { n: ST.lines.length - ok.length })) + '</span>' : '') + '</p>' +
      '<div class="row"><button type="button" class="btn primary" data-rb="pdf">' + esc(L('b_pdf')) + '</button><button type="button" class="btn" data-rb="zip">' + esc(L('b_zip')) + '</button><button type="button" class="btn" data-rb="print">' + esc(L('b_print')) + '</button></div>' +
      (ok.length > 300 ? '<p class="soft">' + esc(L('bigpdf')) + '</p>' : '') +
      '<div class="row"><button type="button" class="btn" data-rb="reg">' + esc(L('b_reg')) + '</button><button type="button" class="btn" data-rb="msgs">' + esc(L('b_msgs')) + '</button></div>' +
      '<h4>' + esc(L('send_h')) + '</h4><p class="soft">' + esc(L('send_lead', { n: reach })) + '</p>' +
      '<div class="row"><button type="button" class="btn' + (reach ? ' primary' : '') + '" data-rb="send"' + (reach ? '' : ' disabled') + '>' + esc(L('b_send', { n: reach })) + '</button>' +
      (NS.onComputer() ? '<label class="chk">' + esc(L('wa_in')) + ' <select id="rb-wa"><option value="auto">' + esc(L('wa_auto')) + '</option><option value="web">WhatsApp Web</option><option value="app">' + esc(L('wa_app')) + '</option></select></label>' : '') + '</div>' +
      '<p class="soft">' + esc(L('notsaved', { no: next() })) + '</p>';
    $('#rb-s3').hidden = false; $('#rb-out').innerHTML = h;
    var w = $('#rb-wa'); if (w) w.value = setOf().wa;
  }
  function next() { var s = ST.ser; if (!s) return ''; return s.head + String(ST.lines.next || s.n).padStart(s.width, '0'); }
  /* the last number given here is remembered, so the next bulk run starts after it (these receipts are not saved in NSBiz) */
  function remember() { if (!ST.ser || ST.sample) return; var n = (ST.lines.next || 1) - 1, k = lastKey(ST.ser.head); if (n > (+get(k, 0) || 0)) put(k, n); }

  /* ---------- the receipts ---------- */
  function docOf(l) {
    var d = Object.assign({}, l.d), p = $('#rb-paper').value;
    d.seller = seller(); d.paper = p; d.copies = 1;
    return d;
  }
  function htmls() {
    var O = OUT(); if (!O) return [];
    var two = $('#rb-copy').checked, fee = K() === 'fee';
    var lab = fee ? ['Student copy', 'Office copy'] : ['orig', 'office'];
    return okLines().map(function (l) { var d = docOf(l); return { l: l, h: two ? lab.map(function (x) { return O.html(d, x); }).join('') : O.html(d, '') }; });
  }
  function fname(l) { return ((K() === 'fee' ? 'Fee receipt ' : 'Receipt ') + l.d.no + ' ' + l.name).replace(/[\\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 90); }
  function needName() { if (seller().name) return true; NS.toast(L('needbiz'), 'bad'); $('#rb-bname').focus(); return false; }
  function stage(list) {
    var hold = document.createElement('div'); hold.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px'; hold.setAttribute('aria-hidden', 'true');
    hold.innerHTML = list.map(function (x) { return x.h; }).join(''); document.body.appendChild(hold);
    return hold;
  }
  function bar(label, n) {
    var b = document.createElement('div'), stop = { yes: false };
    b.className = 'ns-prog'; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="ns-prog-t"></span><span class="ns-prog-b"><i></i></span><button type="button" class="btn sm">' + esc(NS.t('prog.cancel')) + '</button>';
    b.querySelector('button').addEventListener('click', function () { stop.yes = true; this.disabled = true; });
    document.body.appendChild(b);
    stop.step = function (i) { if (stop.yes) throw new Error('cancel'); b.querySelector('.ns-prog-t').textContent = NS.t('prog.of', { l: label, a: i, n: n }); b.querySelector('i').style.width = Math.round(i / n * 100) + '%'; return new Promise(function (r) { setTimeout(r, 0); }); };
    stop.close = function () { b.remove(); };
    return stop;
  }
  function base() { var d = $('#rb-date').value || NS.today(); return (K() === 'fee' ? 'Fee receipts ' : 'Receipts ') + (ST.sample ? 'sample ' : '') + d; }
  function onePdf() {
    if (!needName()) return;
    var list = htmls(), hold = stage(list), sheets = $$('.sh', hold), b = bar(L('making'), sheets.length);
    NS.makePdf(sheets, $('#rb-paper').value, { step: b.step }).then(function (blob) { save(blob, base() + '.pdf'); remember(); }, function (e) { if (!/cancel/.test(e && e.message)) NS.toast(L('pdffail'), 'bad'); })
      .then(function () { hold.remove(); b.close(); });
  }
  function zipPdfs() {
    if (!needName()) return;
    var list = htmls(), files = {}, used = {}, paper = $('#rb-paper').value;
    NS.eachSeq(list, function (x) {
      var hold = stage([x]);
      return NS.makePdf($$('.sh', hold), paper).then(function (blob) { return blob.arrayBuffer(); }).then(function (buf) {
        var nm = fname(x.l), k = nm, i = 2; while (used[k]) k = nm + ' (' + (i++) + ')'; used[k] = 1;
        files[k + '.pdf'] = new Uint8Array(buf); hold.remove();
      }, function (e) { hold.remove(); throw e; });
    }, { label: L('making') }).then(function (r) {
      if (!Object.keys(files).length) return;
      save(NS.xlsx.zip(files), base() + (r && r.cancelled ? ' (part)' : '') + '.zip'); remember();
    }, function () { NS.toast(L('pdffail'), 'bad'); });
  }
  function printAll() {
    if (!needName()) return;
    var sh = $('#sheet'), tool = $('#tool'); if (!sh || !tool) return;
    var keep = sh.innerHTML, tab = tool.getAttribute('data-tab'), old = document.title;
    sh.innerHTML = htmls().map(function (x) { return x.h; }).join('');
    tool.setAttribute('data-tab', 'preview'); document.title = base();
    var done = function () { window.removeEventListener('afterprint', done); sh.innerHTML = keep; tool.setAttribute('data-tab', tab); document.title = old; window.dispatchEvent(new Event('resize')); };
    window.addEventListener('afterprint', done);
    remember();
    setTimeout(function () { window.print(); }, 80);
  }
  function xlsxOut(rows, name, sheet, widths) { save(NS.xlsx.write([[sheet, rows, widths]]), name); }

  /* ---------- one message after another (the visitor's own WhatsApp or mail app; nothing is sent from here) ---------- */
  function waLink(l, text) {
    var how = setOf().wa, M = window.NSMsg;
    if (M && M.ownLink) return M.ownLink('mywa', l.phone, text, how === 'auto' ? '' : how);
    return 'https://wa.me/91' + l.phone + '?text=' + encodeURIComponent(text);
  }
  function sendAll() {
    var list = okLines().filter(function (l) { return l.phone || l.email; }); if (!list.length) return;
    var i = 0, dlg = $('#rb-send');
    if (!dlg) {
      dlg = NS.el('dialog', { id: 'rb-send', 'class': 'rb-send', 'aria-labelledby': 'rb-send-h' }, '');
      document.body.appendChild(dlg);
    }
    function stop() { dlg.close(); drawOut(); }
    function show() {
      while (i < list.length && ST.sent[list[i].d.no] === 'done') i++;
      if (i >= list.length) { dlg.innerHTML = '<div class="dlg-h"><h2 id="rb-send-h">' + esc(L('send_done')) + '</h2></div><div class="dlg-b"><p>' + esc(L('send_sum', { a: count('wa'), b: count('mail'), c: count('skip') })) + '</p><div class="row"><button type="button" class="btn primary" data-s="close">' + esc(NS.t('close')) + '</button></div></div>'; return; }
      var l = list[i], biz = seller(), text = RB.message(l, biz);
      dlg.innerHTML = '<div class="dlg-h"><h2 id="rb-send-h">' + esc(L('send_of', { a: i + 1, n: list.length })) + '</h2><button type="button" class="btn sm" data-s="stop">' + esc(L('stop')) + '</button></div>' +
        '<div class="dlg-b"><p><b>' + esc(l.name) + '</b> · <span class="mono">' + esc(l.d.no) + '</span> · ' + esc(NS.money(l.amt)) + (l.phone ? ' · <span class="mono">' + esc(l.phone) + '</span>' : '') + (l.email ? ' · ' + esc(l.email) : '') + '</p>' +
        '<label class="rb-msg">' + esc(L('msg')) + '<textarea id="rb-text" rows="6">' + esc(text) + '</textarea></label>' +
        '<p class="soft">' + esc(L('send_pdf')) + '</p>' +
        '<div class="row">' + (l.phone ? '<button type="button" class="btn primary" data-s="wa">' + esc(L('open_wa')) + '</button>' : '') + (l.email ? '<button type="button" class="btn' + (l.phone ? '' : ' primary') + '" data-s="mail">' + esc(L('open_mail')) + '</button>' : '') +
          '<button type="button" class="btn" data-s="pdf">' + esc(L('this_pdf')) + '</button><button type="button" class="btn" data-s="copy">' + esc(L('copytext')) + '</button><button type="button" class="btn" data-s="skip">' + esc(L('skip')) + '</button></div></div>';
    }
    function count(k) { return Object.keys(ST.sent).filter(function (n) { return ST.sentHow[n] === k; }).length; }
    ST.sentHow = ST.sentHow || {};
    dlg.onclick = function (e) {
      var b = e.target.closest('[data-s]'); if (!b) return;
      var a = b.getAttribute('data-s'), l = list[i], tx = $('#rb-text') ? $('#rb-text').value : '';
      if (a === 'close' || a === 'stop') return stop();
      if (a === 'wa') { window.open(waLink(l, tx), '_blank', 'noopener'); ST.sent[l.d.no] = 'done'; ST.sentHow[l.d.no] = 'wa'; i++; return show(); }
      if (a === 'mail') { location.href = 'mailto:' + encodeURIComponent(l.email) + '?subject=' + encodeURIComponent(RB.subject(l, seller())) + '&body=' + encodeURIComponent(tx); ST.sent[l.d.no] = 'done'; ST.sentHow[l.d.no] = 'mail'; i++; return show(); }
      if (a === 'copy') { (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { NS.toast(L('copied')); }, function () { $('#rb-text').select(); }); return; }
      if (a === 'pdf') { var x = { l: l, h: OUT().html(docOf(l), '') }, hold = stage([x]); NS.makePdf($$('.sh', hold), $('#rb-paper').value).then(function (blob) { save(blob, fname(l) + '.pdf'); }, function () { NS.toast(L('pdffail'), 'bad'); }).then(function () { hold.remove(); }); return; }
      if (a === 'skip') { ST.sentHow[l.d.no] = 'skip'; i++; return show(); }
    };
    dlg.oncancel = function () { drawOut(); };
    show();
    remember();
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }

  /* ---------- wiring ---------- */
  function wire(b) {
    var s = setOf();
    $('#rb-mode').value = s.mode; $('#rb-paper').value = s.paper === 'a4' ? 'a4' : 'a5'; $('#rb-copy').checked = !!s.copy;
    if ($('#rb-gst')) $('#rb-gst').value = s.gst; if ($('#rb-incl')) $('#rb-incl').checked = s.incl !== false;
    $('#rb-file').addEventListener('change', function () { takeFile(this.files[0]); this.value = ''; });
    ['rb-mode', 'rb-gst', 'rb-incl', 'rb-month', 'rb-paper', 'rb-copy'].forEach(function (id) { var x = $('#' + id); if (x) x.addEventListener('change', run); });
    $('#rb-start').addEventListener('input', function () { this.dataset.typed = '1'; });
    $('#rb-start').addEventListener('change', run);
    $('#rb-date').addEventListener('change', function () { series().then(run); });
    $('#rb-bname').addEventListener('change', function () { series().then(run); });
    $('#rb-biz').addEventListener('change', function () {
      var x = ST.bizes.filter(function (y) { return y.id === this.value; }, this)[0];
      $('#rb-bname').value = x ? x.name || '' : ''; $('#rb-baddr').value = x ? [x.addr, x.city].filter(Boolean).join(', ') : ''; $('#rb-bphone').value = x ? x.phone || '' : '';
      if ($('#rb-bgstin')) $('#rb-bgstin').value = x ? x.gstin || '' : '';
      series().then(run);
    });
    var drop = $('#rb-drop');
    ['dragenter', 'dragover'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (e) { drop.addEventListener(e, function () { drop.classList.remove('on'); }); });
    drop.addEventListener('drop', function (ev) { ev.preventDefault(); var f = ev.dataTransfer && ev.dataTransfer.files; if (f && f.length) takeFile(f[0]); });
    drop.addEventListener('click', function () { $('#rb-file').click(); });
    drop.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('#rb-file').click(); } });
    var ready = window.NSStore ? NSStore.list('biz').then(function (l) {
      ST.bizes = (l || []).filter(function (x) { return x && x.name; });
      var sel = $('#rb-biz'); ST.bizes.forEach(function (x) { var o = document.createElement('option'); o.value = x.id; o.textContent = x.name; sel.appendChild(o); });
      if (ST.bizes.length === 1) { sel.value = ST.bizes[0].id; sel.dispatchEvent(new Event('change')); return; }
      return series();
    }).catch(function () { return series(); }) : Promise.resolve();
    if (b._rbWired) return ready; b._rbWired = true;
    b.addEventListener('change', function (e) {
      if (e.target.id === 'rb-wa') { var p = get(SKEY(), {}); p.wa = e.target.value; put(SKEY(), p); return; }
      var c = e.target.closest('[data-col]'); if (!c || !ST.D) return;
      var f = ST.D.found.filter(function (x) { return x.kind === K(); })[0], map = {};
      $$('[data-col]', b).forEach(function (s) { if (s.value !== '') map[s.getAttribute('data-col')] = +s.value; });
      ST.force = {}; ST.force[f.name] = { kind: K(), row: f.headRow, map: map, sig: f.sig, heads: f.heads }; run();
    });
    b.addEventListener('click', function (e) {
      var x = e.target.closest('[data-rb]'); if (!x) return;
      var a = x.getAttribute('data-rb');
      if (a === 'sample') {
        ST.book = RB.sampleRows(K()); ST.fileName = L('samplefile'); ST.force = null; ST.sample = true; ST.sent = {};
        if (!$('#rb-bname').value) $('#rb-bname').value = L(K() === 'fee' ? 'samplebiz_fee' : 'samplebiz');
        if ($('#rb-month') && K() === 'fee') $('#rb-month').value = '2026-11';
        series().then(function () { run(); $('#rb-s2').scrollIntoView({ block: 'start' }); });
      }
      else if (a === 'template') save(NS.xlsx.write(RB.sampleBook(K())), (K() === 'fee' ? 'Fee list' : 'Payments received') + ' - sample.xlsx');
      else if (a === 'remember') { var f = ST.D && ST.D.found.filter(function (y) { return y.kind === K(); })[0]; if (!f) return; var all = get(LKEY(), {}); all[f.sig] = { kind: K(), map: (ST.force && ST.force[f.name] ? ST.force[f.name].map : f.map) }; put(LKEY(), all); NS.toast(L('rememberok')); }
      else if (a === 'pdf') onePdf();
      else if (a === 'zip') zipPdfs();
      else if (a === 'print') printAll();
      else if (a === 'reg') { xlsxOut(RB.register(ST.lines, ST.D.heads), (K() === 'fee' ? 'Fee receipts register ' : 'Receipts register ') + ($('#rb-date').value || '') + '.xlsx', K() === 'fee' ? 'Fee register' : 'Receipts register'); remember(); }
      else if (a === 'msgs') xlsxOut(RB.messageRows(ST.lines, seller()), 'Receipt messages ' + ($('#rb-date').value || '') + '.xlsx', 'Messages', [16, 24, 13, 26, 70, 40]);
      else if (a === 'send') { if (needName()) sendAll(); }
    });
    return ready;
  }
  function draw() {
    var O = OUT(); ST.kind = O ? O.kind : (($('[data-rcptbulk]') || {}).getAttribute ? $('[data-rcptbulk]').getAttribute('data-rcptbulk') : '') || 'pay';
    var b = box(); if (!b || !RB) return;
    var keep = {};
    ['rb-bname', 'rb-baddr', 'rb-bphone', 'rb-bgstin', 'rb-date', 'rb-month', 'rb-start'].forEach(function (id) { var x = $('#' + id); if (x) keep[id] = x.value; });
    b.innerHTML = html();
    var ready = wire(b);
    Object.keys(keep).forEach(function (id) { if (keep[id] && $('#' + id)) $('#' + id).value = keep[id]; });
    Promise.resolve(ready).then(function () { if (ST.book) run(); });
  }
  function init() { draw(); document.addEventListener('ns-lang', draw); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
