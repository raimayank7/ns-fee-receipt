/* NSRcptBulk: many receipts at once from one Excel or CSV list (byof2-receipts, 28 Nov 2026). Pure: no screen, no storage
   (node scripts/test_rcptbulk.js). rcptbulk.js is the screen on receipt.niveshsahayak.in (kind 'pay': payments received) and
   fee-receipt.niveshsahayak.in (kind 'fee': student fees).
   Reading: NSTpl.readAs with the field sets below (heading row anywhere in the first 15 rows, headings matched by name and the usual
   other words, a remembered layout used again). Fee lists may give the fee heads as columns (Tuition fee, Transport fee ... one
   column each, any heading that is not a known field and holds amounts) or as one "Fee head" + "Amount" pair per line (lines of the
   same student, month and date are joined into one receipt).
   Numbers: one series (the site's own: RCT/26-27/001, FR/26-27/0001 ...), counting on from the start number chosen; a number already
   used by a saved receipt or by another row of the file is skipped. A row with its own receipt number keeps it (checked the same way).
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function (G) {
  'use strict';
  function TP() { return G.NSTpl || require('./tplcore.js'); }
  var NAME_A = ['party', 'party name', 'customer', 'customer name', 'received from', 'payer', 'payer name', 'name of party', 'client', 'client name', 'from', 'account', 'ledger', 'particulars', 'donor', 'member', 'member name', 'tenant'];
  var COMMON = {
    no: { k: 'no', h: 'Receipt No', w: 'Leave empty: numbered for you in series', ex: '', a: ['receipt no', 'receipt number', 'rcpt no', 'voucher no', 'vch no', 'vch no.', 'voucher number', 'rct no', 'receipt', 'vch/bill no', 'bill/vch no', 'vch no/bill no', 'voucher/bill no'] },
    date: { k: 'date', h: 'Date', w: 'dd-mm-yyyy (empty = the date chosen above)', ex: '05-11-2026', a: ['receipt date', 'payment date', 'date of payment', 'received on', 'paid on', 'txn date', 'transaction date', 'voucher date', 'vch date'] },
    mode: { k: 'mode', h: 'Mode', w: 'Cash, UPI, Cheque, Bank (NEFT/RTGS/IMPS), Card, DD', ex: 'UPI', a: ['payment mode', 'mode of payment', 'pay mode', 'paid by', 'payment type', 'instrument', 'through', 'paid through'] },
    ref: { k: 'ref', h: 'Reference', w: 'Cheque no. / UPI or bank reference', ex: '512345678901', a: ['ref', 'ref no', 'reference no', 'reference number', 'cheque no', 'chq no', 'cheque number', 'utr', 'utr no', 'transaction id', 'txn id', 'upi ref', 'instrument no', 'dd no'] },
    refDate: { k: 'refDate', h: 'Cheque date', w: '', ex: '', a: ['chq date', 'instrument date', 'ref date', 'reference date', 'dd date'] },
    bank: { k: 'bank', h: 'Bank', w: 'Bank of the cheque', ex: '', a: ['bank name', 'drawn on', 'drawee bank'] },
    phone: { k: 'phone', h: 'Mobile', w: '10-digit mobile (for WhatsApp)', ex: '9876543210', a: ['phone', 'mobile no', 'mobile number', 'phone no', 'contact', 'contact no', 'whatsapp', 'whatsapp no', 'cell', 'mob'] },
    email: { k: 'email', h: 'Email', w: '', ex: '', a: ['e-mail', 'email id', 'mail', 'email address'] },
    notes: { k: 'notes', h: 'Notes', w: 'Printed under the receipt', ex: '', a: ['remarks', 'remark', 'note', 'narration', 'comments'] }
  };
  /* kind 'pay': payments received (receipt.niveshsahayak.in) */
  var PAY = { k: 'pay', name: 'Payments', words: /receipt|payment|collection|received|cash book|bank book/, cols: [COMMON.no, COMMON.date,
    { k: 'name', h: 'Received from', need: 1, w: 'Name of the person or firm who paid', ex: 'Sharma Traders', a: NAME_A },
    { k: 'amount', h: 'Amount', need: 1, w: 'Money received, without commas or Rs', ex: '25000', a: ['amount received', 'received amount', 'receipt amount', 'amount received (rs)', 'received amount (rs)', 'amount received in rs', 'receipt amount (rs)', 'amount received (₹)', 'amt', 'amount rs', 'amount (rs)', 'amount in rs', 'credit', 'credit amount', 'cr', 'received', 'paid amount', 'payment amount', 'deposit', 'value'] },
    COMMON.mode, COMMON.ref, COMMON.refDate, COMMON.bank,
    { k: 'against', h: 'Against bill', w: 'Bill / invoice no. this money is for', ex: 'INV/26-27/041', a: ['against', 'bill no', 'invoice no', 'invoice number', 'bill number', 'against bill no', 'against invoice', 'ref bill', 'bill ref'] },
    { k: 'purpose', h: 'Towards', w: 'What it was for', ex: 'Part payment', a: ['purpose', 'towards', 'for', 'description', 'details', 'payment for'] },
    { k: 'tds', h: 'TDS', w: 'Tax the payer cut, if any', ex: '', a: ['tds amount', 'tds deducted', 'tax deducted'] },
    { k: 'balance', h: 'Balance due', w: 'Still due after this payment', ex: '', a: ['balance', 'outstanding', 'due', 'balance amount', 'pending'] },
    COMMON.phone, COMMON.email,
    { k: 'addr', h: 'Address', w: '', ex: '', a: ['party address', 'customer address'] },
    { k: 'gstin', h: 'GSTIN', w: '', ex: '', a: ['gst no', 'gstin no', 'gst number', 'gstin/uin', 'party gstin'] },
    COMMON.notes] };
  /* kind 'fee': student fees (fee-receipt.niveshsahayak.in) */
  var FEE = { k: 'fee', name: 'Fees', words: /fee|student|class|school|coaching|tuition|collection/, cols: [COMMON.no, COMMON.date,
    { k: 'name', h: 'Student', need: 1, w: 'Student name as it should print', ex: 'Aarav Singh', a: ['student name', 'name of student', 'name', 'pupil', 'pupil name', 'candidate', 'student\'s name'] },
    { k: 'cls', h: 'Class', w: '', ex: '5', a: ['std', 'standard', 'grade', 'course', 'batch', 'class name', 'programme', 'program'] },
    { k: 'sec', h: 'Section', w: '', ex: 'A', a: ['sec', 'div', 'division'] },
    { k: 'roll', h: 'Roll No', w: 'Roll or admission no.', ex: '12', a: ['roll', 'roll number', 'admission no', 'adm no', 'admission number', 'sr no', 'scholar no', 'enrolment no', 'enrollment no', 'registration no', 'reg no', 'student id'] },
    { k: 'guardian', h: 'Parent / guardian', w: '', ex: 'Harpreet Singh', a: ['parent', 'guardian', 'father', 'father name', 'father\'s name', 'mother name', 'parent name', 'guardian name'] },
    { k: 'session', h: 'Session', w: '2026-27', ex: '2026-27', a: ['academic year', 'year', 'academic session'] },
    { k: 'mFrom', h: 'Month', w: 'Fee month: Nov 2026, 11-2026 or 2026-11 (empty = the month chosen above)', ex: 'Nov 2026', a: ['fee month', 'month from', 'from month', 'for month', 'period', 'fee period', 'months'] },
    { k: 'mTo', h: 'To month', w: 'Only when one receipt covers several months', ex: '', a: ['month to', 'upto', 'up to', 'till month', 'to'] },
    { k: 'head', h: 'Fee head', w: 'Only for one fee head per line (then Amount is that head\'s amount)', ex: '', a: ['head', 'fee type', 'particular', 'fee name', 'charge'] },
    { k: 'amount', h: 'Amount', w: 'With Fee head: that head; without: the whole fee', ex: '', a: ['fee amount', 'amt', 'fees'] },
    { k: 'conc', h: 'Concession', w: 'Scholarship or discount', ex: '', a: ['discount', 'scholarship', 'waiver', 'rebate', 'concession amount'] },
    { k: 'prev', h: 'Previous dues', w: 'Old dues paid now', ex: '', a: ['old dues', 'arrears', 'previous balance', 'opening due', 'previous due', 'last dues'] },
    { k: 'paid', h: 'Paid', w: 'Money received (empty = the whole amount payable)', ex: '', a: ['amount paid (rs)', 'paid (rs)', 'fee paid', 'fees paid', 'amount paid', 'paid amount', 'received', 'received amount', 'amount received', 'collected', 'deposit'] },
    COMMON.mode, COMMON.ref, COMMON.phone, COMMON.email, COMMON.notes] };
  var SETS = { pay: [PAY], fee: [FEE] };
  var FIXED = {}; FEE.cols.forEach(function (c) { FIXED[c.k] = 1; });
  /* a fee head column: any heading that is not a known field, a total or a serial number */
  var NOT_HEAD = /^(s\.?\s*no\.?|sr\.?\s*no\.?|sl\.?\s*no\.?|#|no\.?|total|grand total|total fee|total fees|net|net fee|payable|total payable|balance|balance due|due|dues|gst|tax|remark)$/i;

  function T(s) { return String(s == null ? '' : s).trim(); }
  function key(s) { return T(s).toLowerCase().replace(/\s+/g, ' '); }
  function has(s) { return T(s) !== ''; }
  function num(s) { var a = TP().amt(s); return a && isFinite(a.v) ? Math.abs(a.v) : 0; }
  function r2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* the payment mode a sheet writes, in the receipt makers' own words */
  function modeOf(s) {
    var k = key(s).replace(/[^a-z]/g, ' ');
    if (!k.trim()) return '';
    if (/\b(cash|nakad|nagad)\b/.test(k)) return 'cash';
    if (/\b(upi|gpay|g pay|google pay|phonepe|phone pe|paytm|bhim|qr)\b/.test(k)) return 'upi';
    if (/\b(chq|cheque|check)\b/.test(k)) return 'cheque';
    if (/\b(dd|demand draft|draft)\b/.test(k)) return 'dd';
    if (/\b(card|debit card|credit card|pos|swipe)\b/.test(k)) return 'card';
    if (/\b(neft|rtgs|imps|bank|transfer|online|net banking|netbanking|ecs|nach)\b/.test(k)) return 'bank';
    return 'other';
  }
  /* 'YYYY-MM' from Nov 2026 / November-26 / 11-2026 / 11/26 / 2026-11 / a date / an Excel date number */
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function ymOf(s) {
    s = T(s); if (!s) return ''; var m;
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})$/))) return +m[2] >= 1 && +m[2] <= 12 ? m[1] + '-' + pad(+m[2]) : '';
    if ((m = s.match(/^(\d{1,2})[-\/.](\d{4}|\d{2})$/))) return +m[1] >= 1 && +m[1] <= 12 ? (m[2].length === 2 ? '20' + m[2] : m[2]) + '-' + pad(+m[1]) : '';
    if ((m = s.match(/^([A-Za-z]{3})[A-Za-z]*[\s\-\/.,']*(\d{4}|\d{2})$/)) && MON[m[1].toLowerCase()]) return (m[2].length === 2 ? '20' + m[2] : m[2]) + '-' + pad(MON[m[1].toLowerCase()]);
    var d = TP().date(s); return d ? d.slice(0, 7) : '';
  }
  function monthName(m) { if (!/^\d{4}-\d{2}$/.test(m || '')) return ''; return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }
  function period(a, b) { return monthName(a) + (b && b !== a ? ' to ' + monthName(b) : ''); }
  function mobile(s) { var d = T(s).replace(/\D/g, ''); if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : ''; }
  function email(s) { s = T(s); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : ''; }

  /* ---------- reading ---------- */
  /* -> { rows: [...], found, probs, totals, heads: [fee head names, in sheet order] } */
  function read(book, kind, opts) {
    opts = opts || {};
    /* a fee sheet may name only the student and the fee heads (Student, Tuition fee, Transport fee): readAs needs two known
       columns, so such a sheet is taken from its Student heading */
    if (kind === 'fee') (book || []).forEach(function (sh) {
      if ((opts.force && opts.force[sh.name]) || TP().layoutAs(SETS.fee, sh.name, sh.rows || [], opts.layouts)) return;
      for (var r = 0; r < Math.min((sh.rows || []).length, 15); r++) {
        var hs = sh.rows[r] || [], c = -1;
        hs.forEach(function (h, i) { if (c < 0 && TP().fieldIn(FEE, h) === 'name') c = i; });
        if (c >= 0) { opts = Object.assign({}, opts); opts.force = Object.assign({}, opts.force); opts.force[sh.name] = { kind: 'fee', row: r, map: { name: c }, sig: TP().sig(hs), heads: hs }; break; }
      }
    });
    var D = TP().readAs(book, SETS[kind], opts), rows = D[kind] || [], heads = [];
    D.totals = [];
    rows = rows.filter(function (o) { if (/^(grand\s*|sub\s*-?\s*)?totals?(\s|:|$)/i.test(T(o.name)) || (!T(o.name) && /total/i.test(Object.keys(o).map(function (k) { return k[0] === '_' ? '' : o[k]; }).join(' ')))) { D.totals.push(o._r); return false; } return true; });
    if (kind === 'fee') {
      /* fee heads as their own columns: the columns read() did not take, whose heading is a name and that hold amounts */
      D.found.forEach(function (f) {
        if (f.kind !== 'fee') return;
        var sh = (book || []).filter(function (s) { return s.name === f.name; })[0]; if (!sh) return;
        var used = {}; Object.keys(f.map).forEach(function (k) { used[f.map[k]] = 1; });
        var cols = [];
        (f.heads || []).forEach(function (h, i) {
          if (used[i] || !T(h) || NOT_HEAD.test(T(h).replace(/[.:()]/g, ' ').replace(/\s+/g, ' ').trim()) || /^\d+$/.test(T(h))) return;
          var any = false;
          for (var r = f.headRow + 1; r < sh.rows.length && !any; r++) { var v = T((sh.rows[r] || [])[i]); if (v && num(v) > 0 && /^[\s₹rRsS.,\-()\d]+$/.test(v)) any = true; }
          if (any) cols.push([i, T(h)]);
        });
        f.feeCols = cols.map(function (c) { return c[1]; });
        rows.forEach(function (o) {
          if (o._s !== f.name) return;
          var row = sh.rows[o._r - 1] || [];
          o._heads = cols.map(function (c) { return { desc: c[1], amt: num(row[c[0]]) }; }).filter(function (x) { return x.amt; });
        });
        cols.forEach(function (c) { if (heads.indexOf(c[1]) < 0) heads.push(c[1]); });
      });
    }
    D.rows = rows; D.heads = heads;
    return D;
  }

  /* ---------- working out ---------- */
  /* rows -> receipts. opts: { kind, date (default date), month (default fee month), mode (default mode), gst ('ex' | '18' | 'none', fees),
     incl (fees: GST inside), head (start: the series head e.g. 'RCT/26-27/'), width, start (first number), used: [numbers already saved] }
     Each line: { i, row, sheet, e, d (the document for the printed sheet), amt (money received), errs [[code, vars]], warn [[code, vars]], ok } */
  function work(rows, opts) {
    opts = opts || {};
    var kind = opts.kind || 'pay', lines = [];
    var defDate = TP().date(opts.date) || today(), defMonth = ymOf(opts.month) || defDate.slice(0, 7), defMode = opts.mode || 'cash';
    if (kind === 'fee') {
      /* one fee head per line: lines of the same student, month and date are one receipt */
      var groups = [], byK = {};
      rows.forEach(function (e) {
        if (has(e.head)) {
          var k = [key(e.name), key(e.cls), key(e.roll), T(e.mFrom), T(e.date), T(e.no)].join('|');
          if (byK[k]) { byK[k]._more.push(e); return; }
          e._more = []; byK[k] = e;
        }
        groups.push(e);
      });
      rows = groups;
    }
    rows.forEach(function (e, i) {
      var L = { i: i, row: e._r, sheet: e._s, e: e, errs: [], warn: [] };
      var name = T(e.name), date = has(e.date) ? TP().date(e.date) : defDate, mode = modeOf(e.mode) || defMode;
      if (!name) L.errs.push(['noname']);
      if (has(e.date) && !date) { L.errs.push(['baddate', { v: T(e.date) }]); date = defDate; }
      if (has(e.mode) && modeOf(e.mode) === 'other') L.warn.push(['mode', { v: T(e.mode) }]);
      var ph = mobile(e.phone); if (has(e.phone) && !ph) L.warn.push(['phone', { v: T(e.phone) }]);
      var em = email(e.email); if (has(e.email) && !em) L.warn.push(['email', { v: T(e.email) }]);
      L.phone = ph; L.email = em; L.name = name; L.date = date; L.mode = mode;
      var d = { type: kind === 'fee' ? 'fee' : 'receipt', no: T(e.no), date: date, mode: mode, ref: T(e.ref), notes: T(e.notes), buyer: { name: name, addr: T(e.addr), phone: ph || T(e.phone), gstin: T(e.gstin).toUpperCase(), pan: '' } };
      if (kind === 'pay') {
        var amt = r2(num(e.amount));
        if (!(amt > 0)) L.errs.push(has(e.amount) ? ['badamt', { v: T(e.amount) }] : ['noamt']);
        Object.assign(d, { kind: 'pay', amount: String(amt || ''), refDate: TP().date(e.refDate), bank: T(e.bank), against: T(e.against), purpose: T(e.purpose), tds: num(e.tds) ? String(r2(num(e.tds))) : '', balance: num(e.balance) ? String(r2(num(e.balance))) : '' });
        if (d.mode === 'cheque' && !d.ref) L.warn.push(['nochq']);
        var g = d.buyer.gstin; if (g && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) L.warn.push(['gstin', { v: g }]);
        L.amt = amt;
      } else {
        var mf = has(e.mFrom) ? ymOf(e.mFrom) : defMonth, mt = has(e.mTo) ? ymOf(e.mTo) : '';
        if (has(e.mFrom) && !mf) { L.errs.push(['badmonth', { v: T(e.mFrom) }]); mf = defMonth; }
        if (has(e.mTo) && !mt) L.errs.push(['badmonth', { v: T(e.mTo) }]);
        if (mt && mt < mf) L.errs.push(['months']);
        var lines0;
        if (has(e.head)) lines0 = [e].concat(e._more || []).map(function (x) { return { desc: T(x.head), amt: r2(num(x.amount)) }; }).filter(function (x) { return x.desc || x.amt; });
        else if (e._heads && e._heads.length) lines0 = e._heads.map(function (x) { return { desc: x.desc, amt: r2(x.amt) }; });
        else if (num(e.amount)) lines0 = [{ desc: 'Tuition fee', amt: r2(num(e.amount)) }];
        else if (num(e.paid)) lines0 = [{ desc: 'Fees', amt: r2(num(e.paid)) }];
        else lines0 = [];
        if (!lines0.length) L.errs.push(['nofee']);
        if (e._more && e._more.length) L.joined = e._more.length + 1;
        Object.assign(d, { cls: T(e.cls), sec: T(e.sec), roll: T(e.roll), guardian: T(e.guardian), session: T(e.session), mFrom: mf, mTo: mt || mf,
          lines: lines0.map(function (x) { return { desc: x.desc, amt: String(x.amt) }; }), conc: num(e.conc) ? String(r2(num(e.conc))) : '', prev: num(e.prev) ? String(r2(num(e.prev))) : '',
          paid: has(e.paid) ? String(r2(num(e.paid))) : '', gst: opts.gst || 'ex', incl: opts.incl !== false });
        var o = feeSums(d);
        if (!(o.paid > 0) && !L.errs.length) L.errs.push(['nopaid']);
        if (o.paid > o.payable + 0.005) L.errs.push(['paidmore', { p: o.paid, d: o.payable }]);
        if (o.conc > o.fees + 0.005) L.errs.push(['concmore']);
        d.balance = o.balance; L.amt = o.paid; L.fee = o;
      }
      if (mode === 'cash' && L.amt >= 200000) L.warn.push(['cash2l']);
      L.d = d;
      lines.push(L);
    });
    /* the same person, amount and date twice in one file: often the same line copied */
    var seen = {};
    lines.forEach(function (L) { var k = key(L.name) + '|' + L.amt + '|' + L.date + '|' + key(L.d.ref); if (seen[k]) L.warn.push(['twice', { r: seen[k] }]); else seen[k] = L.row; });
    number(lines, opts);
    lines.forEach(function (L) { L.ok = !L.errs.length; });
    return lines;
  }
  /* the fee receipt's own sums (the same as fee.js): fees - concession, GST if charged, + previous dues = payable; paid; balance */
  function feeSums(d) {
    var o = { fees: 0 };
    d.lines.forEach(function (l) { o.fees += num(l.amt); });
    o.fees = r2(o.fees); o.conc = r2(num(d.conc)); o.prev = r2(num(d.prev));
    var g = d.gst === '18' ? 18 : 0, base = r2(o.fees - o.conc);
    if (g && d.incl) { o.taxable = r2(base * 100 / (100 + g)); o.tax = r2(base - o.taxable); } else { o.taxable = base; o.tax = r2(base * g / 100); }
    o.payable = r2(o.taxable + o.tax + o.prev);
    o.paid = d.paid === '' || d.paid == null ? o.payable : r2(num(d.paid));
    o.balance = r2(o.payable - o.paid);
    return o;
  }
  /* numbers in series: the next free number after start for every receipt without its own; own numbers must not repeat */
  function number(lines, opts) {
    var head = String(opts.head == null ? '' : opts.head), width = +opts.width || 3, n = Math.max(1, Math.floor(+opts.start || 1));
    var used = {}, saved = {}, skipped = 0;
    (opts.used || []).forEach(function (x) { if (T(x)) saved[key(x)] = used[key(x)] = 1; });
    lines.forEach(function (L) {
      var own = L.d.no; if (!own) return;
      if (saved[key(own)]) L.errs.push(['nosaved', { no: own }]);
      else if (used[key(own)]) L.errs.push(['nodup', { no: own }]);
      else used[key(own)] = 1;
    });
    lines.forEach(function (L) {
      if (L.d.no) return;
      var no;
      for (;;) { no = head + String(n).padStart(width, '0'); n++; if (!used[key(no)]) break; skipped++; }
      used[key(no)] = 1; L.d.no = no; L.auto = true;
    });
    lines.skipped = skipped; lines.next = n;
    return lines;
  }

  /* ---------- outputs ---------- */
  var MODEW = { cash: 'cash', upi: 'UPI', cheque: 'cheque', bank: 'bank transfer', card: 'card', dd: 'demand draft', other: 'other means' };
  function rupees(v) { var s = (Math.round(v * 100) / 100).toFixed(2), p = s.split('.'), x = p[0], last = x.slice(-3), rest = x.slice(0, -3); if (rest) last = ',' + last; return '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last + (p[1] === '00' ? '' : '.' + p[1]); }
  function fmtDate(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(0, 4) : iso || ''; }
  /* the message to the payer (WhatsApp or email), English like the receipt */
  function message(L, biz) {
    var d = L.d, b = T(biz && biz.name), out;
    if (d.type === 'fee') {
      var o = L.fee || feeSums(d);
      out = 'Dear parent,\nReceived with thanks ' + rupees(o.paid) + ' as fees of ' + d.buyer.name + (d.cls ? ' (Class ' + d.cls + (d.sec ? '-' + d.sec : '') + ')' : '') + ' for ' + period(d.mFrom, d.mTo) +
        ' by ' + MODEW[d.mode] + ' on ' + fmtDate(d.date) + '.\nFee receipt no. ' + d.no + '.' + (o.balance > 0 ? '\nBalance still due: ' + rupees(o.balance) + '.' : '');
    } else {
      out = 'Dear ' + d.buyer.name + ',\nReceived with thanks ' + rupees(L.amt) + ' by ' + MODEW[d.mode] + (d.ref ? ' (ref. ' + d.ref + ')' : '') + ' on ' + fmtDate(d.date) +
        (d.against ? ' against ' + d.against : '') + '.\nReceipt no. ' + d.no + '.' + (num(d.balance) ? '\nBalance still due: ' + rupees(num(d.balance)) + '.' : '');
    }
    return out + (b ? '\n' + b : '');
  }
  function subject(L, biz) { var b = T(biz && biz.name); return (L.d.type === 'fee' ? 'Fee receipt ' : 'Payment receipt ') + L.d.no + (b ? ' from ' + b : ''); }
  /* the receipts register: one row per receipt (numbers stay numbers), a total row */
  function register(lines, heads) {
    var ok = lines.filter(function (L) { return L.ok; });
    if (!ok.length) return [['No receipts']];
    if (ok[0].d.type === 'fee') {
      var H = []; (heads || []).forEach(function (h) { H.push(h); });
      ok.forEach(function (L) { L.d.lines.forEach(function (l) { if (H.indexOf(l.desc) < 0) H.push(l.desc); }); });
      var head = ['Receipt No', 'Date', 'Student', 'Class', 'Section', 'Roll No', 'Parent / guardian', 'Fee period'].concat(H, ['Fees', 'Concession', 'GST', 'Previous dues', 'Payable', 'Received', 'Balance', 'Mode', 'Reference', 'Mobile', 'Email']);
      var rows = [head], tot = head.map(function () { return 0; }), from = 8;
      ok.forEach(function (L) {
        var d = L.d, o = L.fee || feeSums(d), amts = H.map(function (h) { return d.lines.filter(function (l) { return l.desc === h; }).reduce(function (s, l) { return s + num(l.amt); }, 0); });
        var r = [d.no, fmtDate(d.date), d.buyer.name, d.cls, d.sec, d.roll, d.guardian, period(d.mFrom, d.mTo)].concat(amts, [o.fees, o.conc, o.tax, o.prev, o.payable, o.paid, o.balance, MODEW[d.mode], d.ref, L.phone, L.email]);
        r.forEach(function (v, j) { if (j >= from && j < from + H.length + 7) tot[j] += v; });
        rows.push(r);
      });
      rows.push(tot.map(function (v, j) { return j === 2 ? 'Total (' + ok.length + ')' : j >= from && j < from + H.length + 7 ? r2(v) : ''; }));
      return rows;
    }
    var P = [['Receipt No', 'Date', 'Received from', 'GSTIN', 'Amount', 'TDS', 'Mode', 'Reference', 'Cheque date', 'Bank', 'Against bill', 'Towards', 'Balance due', 'Mobile', 'Email']], t = 0, td = 0;
    ok.forEach(function (L) { var d = L.d; t += L.amt; td += num(d.tds); P.push([d.no, fmtDate(d.date), d.buyer.name, d.buyer.gstin, L.amt, num(d.tds) || '', MODEW[d.mode], d.ref, fmtDate(d.refDate), d.bank, d.against, d.purpose, num(d.balance) || '', L.phone, L.email]); });
    P.push(['', '', 'Total (' + ok.length + ')', '', r2(t), td ? r2(td) : '', '', '', '', '', '', '', '', '', '']);
    return P;
  }
  /* the messages sheet: who, mobile, email, the text and a ready WhatsApp link */
  function messageRows(lines, biz) {
    return [['Receipt No', 'Name', 'Mobile', 'Email', 'Message', 'WhatsApp link']].concat(lines.filter(function (L) { return L.ok; }).map(function (L) {
      var m = message(L, biz); return [L.d.no, L.d.buyer.name, L.phone, L.email, m, L.phone ? 'https://wa.me/91' + L.phone + '?text=' + encodeURIComponent(m) : ''];
    }));
  }

  /* ---------- sample files (made-up people) ---------- */
  var SAMPLE_PAY = [['Received from', 'Amount', 'Date', 'Mode', 'Reference', 'Against bill', 'Mobile', 'Email', 'GSTIN'],
    ['Sharma Traders', '25,000', '03-11-2026', 'NEFT', 'N308261234567', 'INV/26-27/041', '9876543210', 'accounts@sharma.example', '03AAPFS1234C1ZK'],
    ['Gupta Hardware', '12,500', '04-11-2026', 'Cheque', '004512', 'INV/26-27/038', '9812345678', '', ''],
    ['Meena Kumari', '3,200', '04-11-2026', 'Cash', '', '', '9988776655', '', ''],
    ['Bansal & Sons', '48,750.50', '06-11-2026', 'UPI', '612345678901', 'INV/26-27/044', '9876501234', 'bansal@example.com', ''],
    ['Kiran Electricals', '8,000', '07-11-2026', 'GPay', '612398765432', 'Advance for order 17', '9123456780', '', ''],
    ['Total', '97,450.50', '', '', '', '', '', '', '']];
  var SAMPLE_FEE = [['Student', 'Class', 'Section', 'Roll No', 'Parent / guardian', 'Month', 'Tuition fee', 'Transport fee', 'Computer fee', 'Concession', 'Paid', 'Mode', 'Mobile'],
    ['Aarav Singh', '5', 'A', '12', 'Harpreet Singh', 'Nov 2026', '2500', '800', '300', '', '', 'UPI', '9876543210'],
    ['Diya Sharma', '5', 'B', '7', 'Rakesh Sharma', 'Nov 2026', '2500', '', '300', '250', '', 'Cash', '9812345678'],
    ['Kabir Verma', '8', 'A', '21', 'Neha Verma', 'Nov 2026', '3200', '800', '300', '', '3000', 'Cheque', '9988776655'],
    ['Ishita Gupta', '10', 'A', '3', 'Sanjay Gupta', 'Oct 2026', '3800', '800', '', '', '', 'Bank', '9876501234'],
    ['Rohan Mehta', '2', 'C', '15', 'Pooja Mehta', 'Nov 2026', '1800', '800', '', '1800', '', 'Cash', '9123456780']];
  function sampleRows(kind) { return [{ name: kind === 'fee' ? 'Fees' : 'Payments', rows: (kind === 'fee' ? SAMPLE_FEE : SAMPLE_PAY).map(function (r) { return r.slice(); }) }]; }
  /* the blank sheet to fill, as [[sheet, rows, widths], ...] for NS.xlsx.write */
  function sampleBook(kind) {
    var S = kind === 'fee' ? FEE : PAY, sam = kind === 'fee' ? SAMPLE_FEE : SAMPLE_PAY.slice(0, -1);
    var how = [['Column', 'Must fill', 'What to type', 'Example']].concat(S.cols.map(function (c) { return [c.h, c.need ? 'Yes' : '', c.w, c.ex]; }));
    if (kind === 'fee') how.push(['Tuition fee, Transport fee ...', '', 'Fee heads: one column each, any name you use. Or use Fee head + Amount on one line per head.', '2500']);
    how.push(['', '', 'One row per payment. Keep the heading row; other headings are fine too (they are matched by name). Delete the example rows (made-up people) and type your own. Then drop this file on ' + (kind === 'fee' ? 'fee-receipt' : 'receipt') + '.niveshsahayak.in.', '']);
    return [[S.name, sam, sam[0].map(function (h) { return Math.max(11, Math.min(24, String(h).length + 3)); })], ['How to fill', how, [24, 10, 70, 18], 'wrap']];
  }

  var API = { PAY: PAY, FEE: FEE, SETS: SETS, read: read, work: work, number: number, feeSums: feeSums, modeOf: modeOf, ymOf: ymOf, mobile: mobile, period: period, monthName: monthName, message: message, subject: subject, register: register, messageRows: messageRows, sampleRows: sampleRows, sampleBook: sampleBook, num: num };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSRcptBulk = API;
})(typeof window !== 'undefined' ? window : globalThis);
