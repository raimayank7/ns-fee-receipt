/* fee-receipt.niveshsahayak.in: fee receipts for schools, coaching centres, tuition, music and dance classes, and a list of
   monthly dues. Record type 'fee'. Students are saved as parties (with class, roll no. and guardian), so they come back as
   suggestions. School education up to higher secondary is exempt from GST; coaching is taxable at 18% when registered. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t;
  var HEADS = ['Tuition fee', 'Admission fee', 'Exam fee', 'Transport fee', 'Lab fee', 'Library fee', 'Computer fee', 'Sports fee', 'Activity fee', 'Uniform and books', 'Hostel fee', 'Late fee'];
  var K;
  function line(desc, amt) { return { desc: desc || '', amt: amt || '' }; }
  function ym(d) { return String(d || '').slice(0, 7); }
  function monthName(m) { return /^\d{4}-\d{2}$/.test(m || '') ? new Date(m + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''; }
  function nMonths(a, b) { if (!/^\d{4}-\d{2}$/.test(a || '')) return 0; b = /^\d{4}-\d{2}$/.test(b || '') && b >= a ? b : a; return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)) + 1; }
  function sums(d) {
    var o = { fees: 0 };
    d.lines.forEach(function (l) { o.fees += num(l.amt); });
    o.fees = r2(o.fees); o.conc = r2(num(d.conc)); o.prev = r2(num(d.prev));
    o.due = r2(o.fees - o.conc + o.prev);
    var g = d.gst === '18' ? 18 : 0; o.g = g;
    /* GST on this period's fees after concession (old dues already carried their own GST) */
    var base = r2(o.fees - o.conc);
    if (g && d.incl) { o.taxable = r2(base * 100 / (100 + g)); o.tax = r2(base - o.taxable); } else { o.taxable = base; o.tax = r2(base * g / 100); }
    o.payable = r2(o.taxable + o.tax + o.prev);
    o.paid = d.paid === '' || d.paid == null ? o.payable : r2(num(d.paid));
    o.balance = r2(o.payable - o.paid);
    o.total = o.paid;
    o.months = nMonths(d.mFrom, d.mTo);
    return o;
  }
  /* dues: the latest receipt of each student, with its balance and the month paid up to */
  function dues() {
    var who = String(K.doc().seller.name || '').trim().toLowerCase(), dlg = $('#fe-dues');
    NSStore.list('doc').then(function (all) {
      var last = {};
      all.filter(function (x) { return x.type === 'fee' && String(x.seller && x.seller.name || '').trim().toLowerCase() === who; }).forEach(function (x) {
        var k = String(x.buyer.name || '').trim().toLowerCase() + '|' + String(x.cls || '').trim().toLowerCase();
        if (!last[k] || (x.mTo || x.mFrom || x.date) > (last[k].mTo || last[k].mFrom || last[k].date) || x.date > last[k].date) last[k] = x;
      });
      var now = ym(NS.today()), rows = Object.keys(last).map(function (k) { return last[k]; }).sort(function (a, b) { return String(a.cls).localeCompare(String(b.cls), 'en', { numeric: true }) || String(a.buyer.name).localeCompare(String(b.buyer.name)); });
      $('[data-dues]', dlg).innerHTML = rows.length ? '<table class="day"><thead><tr><th>' + esc(t('fe.student')) + '</th><th>' + esc(t('fe.cls')) + '</th><th>' + esc(t('fe.upto')) + '</th><th>' + esc(t('fe.bal')) + '</th><th></th></tr></thead><tbody>' + rows.map(function (x) {
        var upto = x.mTo || x.mFrom || '', late = upto && upto < now, bal = num(x.balance);
        var msg = 'Dear parent, fees of ' + x.buyer.name + (x.cls ? ' (' + x.cls + ')' : '') + ' are paid up to ' + (monthName(upto) || NS.fmtDate(x.date)) + (bal > 0 ? ', with ' + NS.money(bal) + ' still due' : '') + '. Kindly pay the next fees. ' + (x.seller.name || '');
        var ph = String(x.buyer.phone || '').replace(/\D/g, '').slice(-10);
        return '<tr' + (late || bal > 0 ? ' class="warn"' : '') + '><td>' + esc(x.buyer.name) + '</td><td>' + esc(x.cls) + '</td><td>' + esc(monthName(upto) || NS.fmtDate(x.date)) + '</td><td>' + (bal > 0 ? NS.money(bal) : '—') + '</td><td>' +
          (late || bal > 0 ? '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(msg) + '">' + esc(t('fe.remind')) + '</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table><p class="hint">' + esc(t('fe.duesh')) + '</p>' : '<p>' + esc(t('fe.nodues')) + '</p>';
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    });
  }

  K = NS.kit({
    type: 'fee', prefix: 'FR', digits: 4, paper: 'a5', papers: ['a5', 'a4', 'th80'], copies: 2, copyLabels: ['Student copy', 'Office copy'],
    name: function () { return 'Fee Receipt'; },
    blank: function () { var m = ym(NS.today()); return { cls: '', sec: '', roll: '', guardian: '', session: '', mFrom: m, mTo: m, lines: [line('Tuition fee')], conc: '', prev: '', paid: '', mode: 'cash', ref: '', gst: 'ex', incl: true, balance: 0 }; },
    newRow: function () { return line(); },
    keepOnNew: function (d) { return { affil: d.affil, gst: d.gst, incl: d.incl, paper: d.paper, session: d.session, mFrom: d.mFrom, mTo: d.mTo, lines: d.lines.map(function (l) { return line(l.desc, l.amt); }) }; },
    party: 'customer',
    form: function (K) {
      return K.card(t('fe.lgstu'), '<div class="fg">' +
          K.f('buyer.name', t('fe.student'), { wide: true, hint: t('fe.stuh') }) + K.f('guardian', t('fe.guard')) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('cls', t('fe.cls')) + K.f('sec', t('fe.sec')) + K.f('roll', t('fe.roll'), { ltr: 1 }) + K.f('session', t('fe.session'), { ph: '2026-27', ltr: 1 }) + '</div>') +
        K.numCard(K.f('mFrom', t('fe.from'), { type: 'month' }) + K.f('mTo', t('fe.to'), { type: 'month' })) +
        K.card(t('fe.lgfees'), K.list('lines', t('fe.addhead')) + '<div class="fg">' +
          K.f('conc', t('fe.conc'), { mode: 'decimal', ltr: 1 }) + K.f('prev', t('fe.prev'), { mode: 'decimal', ltr: 1 }) +
          K.f('gst', t('fe.gst'), { type: 'select', wide: true, opts: [['ex', t('fe.gex')], ['18', t('fe.g18')], ['none', t('fe.gnone')]], hint: t('fe.gsth') }) + K.f('incl', t('fe.incl'), { type: 'check', show: 'gst=18' }) +
          '<datalist id="dl-heads">' + HEADS.map(function (h) { return '<option value="' + h + '">'; }).join('') + '</datalist></div>') +
        K.card(t('pos.pay'), '<div class="fg">' + K.f('paid', t('fe.paid'), { mode: 'decimal', ltr: 1, hint: t('fe.paidh') }) +
          K.f('mode', t('s.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'cheque', 'bank', 'card']) }) + K.f('ref', t('s.ref'), { ltr: 1 }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="f wide"><button type="button" class="btn" data-fe="dues">' + esc(t('fe.dues')) + '</button></div></div>') +
        K.bizCard({ lg: t('fe.lginst'), extra: K.f('affil', t('fe.affil'), { ltr: 1 }) }) + K.lookCard();
    },
    rows: {
      lines: function (l, i, K) { return K.rf('lines', i, 'desc', t('fe.head'), { cls: 'it-d', list: 'dl-heads' }) + K.rf('lines', i, 'amt', t('fe.amt'), { mode: 'decimal', ltr: 1 }); }
    },
    pickParty: function (p, d) { d.cls = p.cls || d.cls; d.sec = p.sec || d.sec; d.roll = p.roll || d.roll; d.guardian = p.guardian || d.guardian; },
    sums: sums,
    edSums: function (d, o) {
      return '<span>' + esc(t('fe.s.fees', { v: NS.money(o.fees), n: o.months })) + '</span>' + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') +
        '<span>' + esc(t('fe.s.pay', { v: NS.money(o.payable) })) + '</span><b>' + esc(t('fe.s.paid', { v: NS.money(o.paid) })) + '</b>' + (o.balance > 0 ? '<span class="warn">' + esc(t('fe.s.bal', { v: NS.money(o.balance) })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('fe.v.stu')]);
      if (!(o.paid > 0)) p.push(['k-paid', t('s.v.amount')]);
      if (o.paid > o.payable + 0.005) p.push(['k-paid', t('fe.v.more')]);
      if (d.gst === '18' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.mTo && d.mFrom && d.mTo < d.mFrom) p.push(['k-mTo', t('fe.v.months')]);
      return p;
    },
    confirm: function (d, o) { return d.mode === 'cash' && o.paid >= 200000 ? t('c.cash2l') : ''; },
    record: function (rec, o) {
      rec.balance = o.balance;
      /* the App counts the money received as income (GST only when charged) */
      var g = o.g, paidTax = g ? r2(o.paid * o.tax / (o.payable || 1)) : 0;
      rec.kind = g ? 'tax' : 'plain'; rec.withGst = !!g; rec.status = 'paid'; rec.payMode = rec.mode;
      rec.items = [{ desc: 'Fees ' + (monthName(rec.mFrom) || '') + (rec.mTo && rec.mTo !== rec.mFrom ? ' to ' + monthName(rec.mTo) : '') + ' (' + (rec.buyer.name || '') + ')', hsn: '9992', qty: 1, rate: String(r2(o.paid - paidTax)), disc: '', gst: g }];
    },
    saved: function (rec) {
      /* the student's class, roll no. and guardian are kept with the party */
      NSStore.list('party').then(function (all) {
        var k = String(rec.buyer.name || '').trim().toLowerCase(), hit = all.filter(function (x) { return String(x.name || '').trim().toLowerCase() === k; })[0];
        if (hit) NSStore.put('party', Object.assign(hit, { cls: rec.cls, sec: rec.sec, roll: rec.roll, guardian: rec.guardian }));
      });
    },
    copyOf: function (d) {
      /* next month's receipt: months move on, old balance becomes previous dues */
      var span = nMonths(d.mFrom, d.mTo) || 1, f = d.mTo || d.mFrom || ym(NS.today()), y = +f.slice(0, 4), m = +f.slice(5, 7) + 1; if (m > 12) { m = 1; y++; }
      d.mFrom = y + '-' + String(m).padStart(2, '0'); var e = new Date(y, m - 1 + span - 1, 1); d.mTo = e.getFullYear() + '-' + String(e.getMonth() + 1).padStart(2, '0');
      d.prev = d.balance > 0 ? String(d.balance) : ''; d.paid = ''; d.ref = ''; d.balance = 0;
    },
    copyLbl: 'fe.next',
    histName: function (d) { return (d.buyer && d.buyer.name || '') + (d.cls ? ' · ' + d.cls : '') + ' · ' + (monthName(d.mFrom) || '') + (d.mTo && d.mTo !== d.mFrom ? '–' + monthName(d.mTo) : ''); },
    histText: function (d) { return [d.cls, d.roll, d.guardian].join(' '); },
    histPill: function (d) { return num(d.balance) > 0 ? ' <span class="pill">' + esc(t('fe.s.bal', { v: NS.money(num(d.balance)) })) + '</span>' : ''; },
    upiShare: false,
    shareText: function (d, o) { return '\nStudent: ' + (d.buyer.name || '') + (d.cls ? ' (' + d.cls + ')' : '') + (o.balance > 0 ? '\nBalance due: ' + NS.money(o.balance) : ''); },
    sheet: function (d, o, K, label) {
      var b = d.buyer, period = monthName(d.mFrom) + (d.mTo && d.mTo !== d.mFrom ? ' to ' + monthName(d.mTo) : '');
      var meta = [['Receipt No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Student', '<b>' + esc(b.name) + '</b>'], d.guardian ? ['Parent / guardian', esc(d.guardian)] : null,
        ['Class', esc(d.cls) + (d.sec ? ' – ' + esc(d.sec) : '')], d.roll ? ['Roll / adm. no.', esc(d.roll)] : null, d.session ? ['Session', esc(d.session)] : null, ['Fee period', esc(period)]];
      var rows = d.lines.filter(function (l) { return l.desc || num(l.amt); });
      var tot = [['Fees', NS.money(o.fees)], o.conc ? ['Concession / scholarship', '−' + NS.money(o.conc)] : null, o.tax && !d.incl ? ['Taxable value', NS.money(o.taxable)] : null,
        o.tax ? [(d.incl ? 'Includes ' : '') + 'GST 18%', NS.money(o.tax)] : null, o.prev ? ['Previous dues', NS.money(o.prev)] : null, ['Total payable', NS.money(o.payable)], ['Received', NS.money(o.paid), 'grand'], o.balance > 0 ? ['Balance due', NS.money(o.balance)] : null];
      var pay = 'Received by ' + ({ cash: 'cash', upi: 'UPI', cheque: 'cheque', bank: 'bank transfer', card: 'card' }[d.mode] || 'other means') + (d.ref ? ' (ref. ' + esc(d.ref) + ')' : '') + '.';
      var gstNote = d.gst === 'ex' ? 'Education services by a school up to higher secondary are exempt from GST.' : d.gst === '18' ? 'SAC 9992. GST charged at 18%.' : '';
      if (/^th/.test(d.paper)) return K.thOpen(d, 'FEE RECEIPT') + (label ? '<p class="copy">' + label + '</p>' : '') + K.kv(meta) + '<table class="tl"><tbody>' + rows.map(function (l) { return '<tr><td class="l">' + esc(l.desc) + '</td><td class="n">' + NS.money(num(l.amt), false) + '</td></tr>'; }).join('') + '</tbody></table>' +
        K.kv(tot, 'tot') + '<p class="words">' + NS.inWords(o.paid) + '</p><p class="nt1">' + pay + '</p>' + (gstNote ? '<p class="nt1">' + gstNote + '</p>' : '') + K.made() + '</div>';
      return K.open(d, 'fee') + K.head(d, 'FEE RECEIPT', label || '', d.affil ? '<p>Affiliation / reg. no.: ' + esc(d.affil) + '</p>' : '') + K.meta(meta) +
        '<table class="lines"><thead><tr><th>#</th><th class="l">Fee head</th><th class="n">Amount</th></tr></thead><tbody>' + (rows.length ? rows.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(l.desc) + '</td><td class="n">' + NS.money(num(l.amt), false) + '</td></tr>'; }).join('') : '<tr><td colspan="3" class="ph">Fee heads you add appear here</td></tr>') + '</tbody></table>' +
        '<div class="foot"><div class="foot-l">' + (o.paid ? '<p class="words"><span>Amount received in words:</span> <b>' + NS.inWords(o.paid) + '</b></p>' : '') + '<p class="small">' + pay + '</p>' + (gstNote ? '<p class="small">' + gstNote + '</p>' : '') +
          (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot(tot) + '</div></div>' +
        '<div class="signs">' + K.blankSign('', 'Parent / student') + K.sign(d, '', 'Accountant / authorised signatory') + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) { var b = $('[data-fe="dues"]', ed); if (b) b.addEventListener('click', dues); },
    ready: function () {
      if ($('#fe-dues')) return;
      var x = NS.el('dialog', { id: 'fe-dues', 'aria-labelledby': 'fe-dues-h' }, '<div class="dlg-h"><h2 id="fe-dues-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-dues></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      function names() { $('h2', x).textContent = t('fe.dues'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', names);
    }
  });
})();
