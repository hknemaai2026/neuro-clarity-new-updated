import ExcelJS from 'exceljs';
import path from 'path';

async function generateLoanWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Antigravity Loan Manager';
  wb.created = new Date();
  wb.modified = new Date();

  // Premium Palette
  const NAVY_DARK = 'FF0F2744';
  const NAVY_MED = 'FF1B3A60';
  const BLUE_HEADER = 'FF244B7A';
  const BLUE_ACCENT = 'FF2563EB';
  const LIGHT_BLUE = 'FFEBF3FC';
  const LIGHT_GRAY = 'FFF8FAFC';
  const BORDER_COLOR = 'FFCBD5E1';
  const PAID_GREEN_BG = 'FFD4EDDA';
  const PAID_GREEN_TXT = 'FF155724';
  const PENDING_YELLOW_BG = 'FFFFF3CD';
  const PENDING_YELLOW_TXT = 'FF856404';
  const WHITE = 'FFFFFFFF';
  const TEXT_DARK = 'FF1E293B';
  const TEXT_MUTED = 'FF64748B';
  const LOAN_BANNER_BG = 'FF1E293B';
  const LOAN_BANNER_TXT = 'FFFFFFFF';

  const thinBorder = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };

  const headerBorder = {
    top: { style: 'medium', color: { argb: NAVY_DARK } },
    left: { style: 'thin', color: { argb: NAVY_MED } },
    bottom: { style: 'medium', color: { argb: NAVY_DARK } },
    right: { style: 'thin', color: { argb: NAVY_MED } },
  };

  // Loans Data
  const loans = [
    {
      name: 'Fibe',
      displayName: 'Fibe (EarlySalary)',
      totalMonths: 12,
      remainingMonths: 11,
      interest: 0.27,
      totalAmount: 215000,
      amountRemaining: 200276,
      emi: 20644,
      completedMonths: 1,
      bannerColor: 'FF1E3A8A' // Dark Blue
    },
    {
      name: 'Poonawalla',
      displayName: 'Poonawalla Fincorp',
      totalMonths: 36,
      remainingMonths: 25,
      interest: 0.27,
      totalAmount: 189000,
      amountRemaining: 144442,
      emi: 7716,
      completedMonths: 11,
      bannerColor: 'FF065F46' // Dark Emerald
    },
    {
      name: 'Aditya Birla',
      displayName: 'Aditya Birla Capital',
      totalMonths: 24,
      remainingMonths: 10,
      interest: 0.27,
      totalAmount: 144000,
      amountRemaining: 93754,
      emi: 7903,
      completedMonths: 14,
      bannerColor: 'FF991B1B' // Dark Red
    },
    {
      name: 'Moneyview',
      displayName: 'Moneyview',
      totalMonths: 9,
      remainingMonths: 8,
      interest: 0.27,
      totalAmount: 50000,
      amountRemaining: 46906,
      emi: 6322,
      completedMonths: 1,
      bannerColor: 'FF581C87' // Dark Purple
    },
    {
      name: 'Personal Loan',
      displayName: 'Personal Loan (Bank)',
      totalMonths: 48,
      remainingMonths: 18,
      interest: 0.1265,
      totalAmount: 600000,
      amountRemaining: 260113,
      emi: 15993,
      completedMonths: 30,
      bannerColor: 'FF0F766E' // Dark Teal
    },
    {
      name: 'kisht',
      displayName: 'Kisht Loan',
      totalMonths: 12,
      remainingMonths: 10,
      interest: 0.27,
      totalAmount: 15926,
      amountRemaining: 3180,
      emi: 1600,
      completedMonths: 2,
      bannerColor: 'FF9A3412' // Dark Amber/Orange
    }
  ];

  const banks = [
    { name: 'ICICI Bank Credit Card', limit: 80000, outstanding: 80000, remarks: 'Immediate Action Needed: 100% Utilized (High Interest & CIBIL impact)' },
    { name: 'HSBC Credit Card', limit: 107000, outstanding: 0, remarks: 'Active & Clean: ₹1,07,000 Available Limit' },
    { name: 'Axis Bank Card', limit: 15000, outstanding: 0, remarks: 'Active & Clean: ₹15,000 Available Limit' },
    { name: 'RBL Bank Card', limit: 24000, outstanding: 0, remarks: 'Active & Clean: ₹24,000 Available Limit' }
  ];

  function getDueDate(monthIndex) {
    const baseYear = 2026;
    const baseMonth = 11; // 0-indexed: 11 is December
    const d = new Date(baseYear, baseMonth + monthIndex, 5);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMonthLabel(monthIndex) {
    const baseYear = 2026;
    const baseMonth = 11;
    const d = new Date(baseYear, baseMonth + monthIndex, 5);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  // -------------------------------------------------------------
  // Calculate Tracker Row Mapping with Section Banners
  // -------------------------------------------------------------
  // We'll structure Tracker:
  // Row 4: Main Column Headers
  // For each loan:
  //   1 banner row
  //   N data rows
  // Let's compute exact row ranges for each loan so Dashboard formulas are 100% accurate!

  let trTrackerCursor = 5;
  const loanRanges = [];
  const allDataRows = [];

  loans.forEach(loan => {
    const bannerRow = trTrackerCursor;
    trTrackerCursor++; // banner row
    const dataStartRow = trTrackerCursor;
    const dataEndRow = trTrackerCursor + loan.remainingMonths - 1;
    loanRanges.push({
      loanName: loan.name,
      bannerRow,
      dataStartRow,
      dataEndRow,
      count: loan.remainingMonths
    });
    for (let r = dataStartRow; r <= dataEndRow; r++) {
      allDataRows.push(r);
    }
    trTrackerCursor = dataEndRow + 1;
  });

  const trackerMinDataRow = allDataRows[0];
  const trackerMaxDataRow = allDataRows[allDataRows.length - 1];
  const trackerSheetName = "'EMI Payment Tracker'";

  // -------------------------------------------------------------
  // SHEET 1: DASHBOARD
  // -------------------------------------------------------------
  const wsDash = wb.addWorksheet('📊 Overview & Dashboard', {
    views: [{ showGridLines: true }]
  });

  wsDash.columns = [
    { width: 4 },   // A: Margin
    { width: 22 },  // B: Loan Name
    { width: 14 },  // C: Interest Rate
    { width: 14 },  // D: Total Months
    { width: 14 },  // E: Initial Remaining
    { width: 16 },  // F: Months Remaining (Live)
    { width: 18 },  // G: Total Amount
    { width: 18 },  // H: Initial Outstanding
    { width: 20 },  // I: Current Outstanding (Live)
    { width: 18 },  // J: Amount Paid (Live)
    { width: 16 },  // K: Monthly EMI
    { width: 14 },  // L: % Cleared
    { width: 14 },  // M: Status
  ];

  // Title Banner
  wsDash.mergeCells('B2:M2');
  const titleCell = wsDash.getCell('B2');
  titleCell.value = 'LOAN MANAGEMENT & EMI TRACKER';
  titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(2).height = 40;

  wsDash.mergeCells('B3:M3');
  const subtitleCell = wsDash.getCell('B3');
  subtitleCell.value = 'Dynamic App Loans & Bank Liabilities Tracker • Live Outstanding Updates as Checkboxes are Marked PAID';
  subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: WHITE } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(3).height = 22;

  // KPI Summary Cards (Row 5 to 7)
  const cards = [
    { colStart: 'B', colEnd: 'C', label: 'TOTAL LOAN TAKEN', formula: '=SUM(G11:G16)', format: '₹#,##,##0', sub: '6 App Loans Total' },
    { colStart: 'D', colEnd: 'E', label: 'CURRENT OUTSTANDING', formula: '=SUM(I11:I16)', format: '₹#,##,##0', sub: '📉 Live (Decreases with Ticks)', highlight: true },
    { colStart: 'F', colEnd: 'G', label: 'TOTAL PAID SO FAR', formula: '=SUM(J11:J16)', format: '₹#,##,##0', sub: '💰 Live (Increases with Ticks)' },
    { colStart: 'H', colEnd: 'I', label: 'TOTAL MONTHLY EMI', formula: '=SUM(K11:K16)', format: '₹#,##,##0', sub: 'Monthly Outflow Commitment' },
    { colStart: 'J', colEnd: 'K', label: 'OVERALL PAID %', formula: '=J17/G17', format: '0.0%', sub: 'Debt Freedom Progress' },
    { colStart: 'L', colEnd: 'M', label: 'BANK CARD OUTSTANDING', formula: '=D26', format: '₹#,##,##0', sub: 'ICICI / CC Balance' },
  ];

  cards.forEach(c => {
    wsDash.mergeCells(`${c.colStart}5:${c.colEnd}5`);
    const lbl = wsDash.getCell(`${c.colStart}5`);
    lbl.value = c.label;
    lbl.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: c.highlight ? WHITE : TEXT_MUTED } };
    lbl.alignment = { horizontal: 'center', vertical: 'middle' };
    lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.highlight ? NAVY_DARK : LIGHT_BLUE } };

    wsDash.mergeCells(`${c.colStart}6:${c.colEnd}6`);
    const val = wsDash.getCell(`${c.colStart}6`);
    val.value = { formula: c.formula };
    val.numFmt = c.format;
    val.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: c.highlight ? WHITE : BLUE_ACCENT } };
    val.alignment = { horizontal: 'center', vertical: 'middle' };
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.highlight ? NAVY_DARK : LIGHT_BLUE } };

    wsDash.mergeCells(`${c.colStart}7:${c.colEnd}7`);
    const sub = wsDash.getCell(`${c.colStart}7`);
    sub.value = c.sub;
    sub.font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: c.highlight ? 'FFE2E8F0' : TEXT_MUTED } };
    sub.alignment = { horizontal: 'center', vertical: 'middle' };
    sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.highlight ? NAVY_DARK : LIGHT_BLUE } };

    [`${c.colStart}5`, `${c.colEnd}5`, `${c.colStart}6`, `${c.colEnd}6`, `${c.colStart}7`, `${c.colEnd}7`].forEach(cellRef => {
      wsDash.getCell(cellRef).border = thinBorder;
    });
  });

  wsDash.getRow(5).height = 18;
  wsDash.getRow(6).height = 30;
  wsDash.getRow(7).height = 18;

  // Section 1 Header
  wsDash.mergeCells('B9:M9');
  const sec1 = wsDash.getCell('B9');
  sec1.value = '📱 APP LOANS SUMMARY & LIVE TRACKING TABLE (Tick EMIs in "EMI Payment Tracker" Sheet)';
  sec1.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  sec1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  wsDash.getRow(9).height = 26;

  // Table Headers
  const tableHeaders = [
    { col: 'B', title: 'App Loan Name' },
    { col: 'C', title: 'Interest' },
    { col: 'D', title: 'Total Months' },
    { col: 'E', title: 'Start Remaining' },
    { col: 'F', title: 'Months Left ⏳' },
    { col: 'G', title: 'Total Amount' },
    { col: 'H', title: 'Start Outstanding' },
    { col: 'I', title: 'Current Outstanding 📉' },
    { col: 'J', title: 'Amount Paid 💰' },
    { col: 'K', title: 'Monthly EMI' },
    { col: 'L', title: '% Cleared' },
    { col: 'M', title: 'Status' }
  ];

  tableHeaders.forEach(h => {
    const cell = wsDash.getCell(`${h.col}10`);
    cell.value = h.title;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;
  });
  wsDash.getRow(10).height = 30;

  // Populate Rows 11 to 16
  loans.forEach((loan, idx) => {
    const rowNum = 11 + idx;
    const displayName = loan.displayName || loan.name;
    const loanNameMatch = loan.name;
    const rng = loanRanges[idx];

    const r = wsDash.getRow(rowNum);
    r.height = 24;

    // B: Loan Name
    r.getCell('B').value = displayName;
    r.getCell('B').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('B').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // C: Interest
    r.getCell('C').value = loan.interest;
    r.getCell('C').numFmt = '0.00%';
    r.getCell('C').alignment = { horizontal: 'center', vertical: 'middle' };

    // D: Total Months
    r.getCell('D').value = loan.totalMonths;
    r.getCell('D').alignment = { horizontal: 'center', vertical: 'middle' };

    // E: Initial Remaining
    r.getCell('E').value = loan.remainingMonths;
    r.getCell('E').alignment = { horizontal: 'center', vertical: 'middle' };

    // F: Live Months Remaining:
    // Uses exact range for this loan in Tracker:
    // = E_row - (COUNTIF(Tracker!F{start}:F{end}, "PAID") + COUNTIF(Tracker!F{start}:F{end}, TRUE))
    r.getCell('F').value = {
      formula: `MAX(0, E${rowNum} - (COUNTIF(${trackerSheetName}!$F$${rng.dataStartRow}:$F$${rng.dataEndRow}, "PAID") + COUNTIF(${trackerSheetName}!$F$${rng.dataStartRow}:$F$${rng.dataEndRow}, TRUE)))`
    };
    r.getCell('F').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFC2410C' } };
    r.getCell('F').alignment = { horizontal: 'center', vertical: 'middle' };

    // G: Total Amount
    r.getCell('G').value = loan.totalAmount;
    r.getCell('G').numFmt = '₹#,##,##0';
    r.getCell('G').alignment = { horizontal: 'right', vertical: 'middle' };

    // H: Start Outstanding
    r.getCell('H').value = loan.amountRemaining;
    r.getCell('H').numFmt = '₹#,##,##0';
    r.getCell('H').alignment = { horizontal: 'right', vertical: 'middle' };

    // I: Live Current Outstanding Formula:
    // = MAX(0, H_row - (SUMIF(Tracker!F{start}:F{end}, "PAID", Tracker!E{start}:E{end}) + SUMIF(Tracker!F{start}:F{end}, TRUE, Tracker!E{start}:E{end})))
    r.getCell('I').value = {
      formula: `MAX(0, H${rowNum} - (SUMIF(${trackerSheetName}!$F$${rng.dataStartRow}:$F$${rng.dataEndRow}, "PAID", ${trackerSheetName}!$E$${rng.dataStartRow}:$E$${rng.dataEndRow}) + SUMIF(${trackerSheetName}!$F$${rng.dataStartRow}:$F$${rng.dataEndRow}, TRUE, ${trackerSheetName}!$E$${rng.dataStartRow}:$E$${rng.dataEndRow})))`
    };
    r.getCell('I').numFmt = '₹#,##,##0';
    r.getCell('I').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
    r.getCell('I').alignment = { horizontal: 'right', vertical: 'middle' };

    // J: Amount Paid: = G_row - I_row
    r.getCell('J').value = {
      formula: `G${rowNum} - I${rowNum}`
    };
    r.getCell('J').numFmt = '₹#,##,##0';
    r.getCell('J').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
    r.getCell('J').alignment = { horizontal: 'right', vertical: 'middle' };

    // K: Monthly EMI
    r.getCell('K').value = loan.emi;
    r.getCell('K').numFmt = '₹#,##,##0';
    r.getCell('K').alignment = { horizontal: 'right', vertical: 'middle' };

    // L: % Cleared: = J_row / G_row
    r.getCell('L').value = {
      formula: `J${rowNum} / G${rowNum}`
    };
    r.getCell('L').numFmt = '0.0%';
    r.getCell('L').alignment = { horizontal: 'center', vertical: 'middle' };

    // M: Status: =IF(I_row<=0, "CLOSED 🎉", "ACTIVE")
    r.getCell('M').value = {
      formula: `IF(I${rowNum}<=0, "CLOSED 🎉", "ACTIVE")`
    };
    r.getCell('M').alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell('M').font = { name: 'Segoe UI', size: 9, bold: true };

    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(col).border = thinBorder;
    });
  });

  // Row 17: Grand Total Row
  const totalRow = wsDash.getRow(17);
  totalRow.height = 28;
  totalRow.getCell('B').value = 'TOTAL APP LOANS';
  totalRow.getCell('B').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
  totalRow.getCell('B').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  totalRow.getCell('C').value = '-';
  totalRow.getCell('C').alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell('D').value = { formula: '=SUM(D11:D16)' };
  totalRow.getCell('D').alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell('E').value = { formula: '=SUM(E11:E16)' };
  totalRow.getCell('E').alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell('F').value = { formula: '=SUM(F11:F16)' };
  totalRow.getCell('F').alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell('G').value = { formula: '=SUM(G11:G16)' };
  totalRow.getCell('G').numFmt = '₹#,##,##0';
  totalRow.getCell('G').alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell('H').value = { formula: '=SUM(H11:H16)' };
  totalRow.getCell('H').numFmt = '₹#,##,##0';
  totalRow.getCell('H').alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell('I').value = { formula: '=SUM(I11:I16)' };
  totalRow.getCell('I').numFmt = '₹#,##,##0';
  totalRow.getCell('I').alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell('J').value = { formula: '=SUM(J11:J16)' };
  totalRow.getCell('J').numFmt = '₹#,##,##0';
  totalRow.getCell('J').alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell('K').value = { formula: '=SUM(K11:K16)' };
  totalRow.getCell('K').numFmt = '₹#,##,##0';
  totalRow.getCell('K').alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell('L').value = { formula: '=J17 / G17' };
  totalRow.getCell('L').numFmt = '0.0%';
  totalRow.getCell('L').alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell('M').value = 'LIVE TRACKED';
  totalRow.getCell('M').alignment = { horizontal: 'center', vertical: 'middle' };

  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
    const c = totalRow.getCell(col);
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    c.border = headerBorder;
  });

  // Bank & Credit Cards Table (Row 20 to 26)
  wsDash.mergeCells('B20:M20');
  const sec2 = wsDash.getCell('B20');
  sec2.value = '💳 BANK & CREDIT CARD LIMITS / OUTSTANDING';
  sec2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  sec2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  wsDash.getRow(20).height = 24;

  const bankHeaders = [
    { col: 'B', title: 'Bank / Card Name' },
    { col: 'C', title: 'Total Limit' },
    { col: 'D', title: 'Outstanding' },
    { col: 'E', title: 'Available Limit' },
    { col: 'F', title: 'Utilization %' },
    { col: 'G', colEnd: 'M', title: 'Status & Priority Action' }
  ];

  bankHeaders.forEach(h => {
    if (h.colEnd) {
      wsDash.mergeCells(`${h.col}21:${h.colEnd}21`);
    }
    const cell = wsDash.getCell(`${h.col}21`);
    cell.value = h.title;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = headerBorder;
  });
  wsDash.getRow(21).height = 26;

  banks.forEach((b, idx) => {
    const rNum = 22 + idx;
    const r = wsDash.getRow(rNum);
    r.height = 22;

    r.getCell('B').value = b.name;
    r.getCell('B').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('B').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    r.getCell('C').value = b.limit;
    r.getCell('C').numFmt = '₹#,##,##0';
    r.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };

    r.getCell('D').value = b.outstanding;
    r.getCell('D').numFmt = '₹#,##,##0';
    r.getCell('D').alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell('D').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: b.outstanding > 0 ? 'FFB91C1C' : 'FF15803D' } };

    r.getCell('E').value = { formula: `C${rNum} - D${rNum}` };
    r.getCell('E').numFmt = '₹#,##,##0';
    r.getCell('E').alignment = { horizontal: 'right', vertical: 'middle' };

    r.getCell('F').value = { formula: `IF(C${rNum}>0, D${rNum}/C${rNum}, 0)` };
    r.getCell('F').numFmt = '0.0%';
    r.getCell('F').alignment = { horizontal: 'center', vertical: 'middle' };

    wsDash.mergeCells(`G${rNum}:M${rNum}`);
    const rem = wsDash.getCell(`G${rNum}`);
    rem.value = b.remarks;
    rem.font = { name: 'Segoe UI', size: 9, italic: true };
    rem.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    ['B', 'C', 'D', 'E', 'F'].forEach(col => {
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(col).border = thinBorder;
    });
    for (let c = 7; c <= 13; c++) {
      r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(c).border = thinBorder;
    }
  });

  // Bank Total Row (Row 26)
  const bankTotalRow = wsDash.getRow(26);
  bankTotalRow.height = 26;
  bankTotalRow.getCell('B').value = 'TOTAL BANK LIABILITIES';
  bankTotalRow.getCell('C').value = { formula: '=SUM(C22:C25)' };
  bankTotalRow.getCell('C').numFmt = '₹#,##,##0';
  bankTotalRow.getCell('D').value = { formula: '=SUM(D22:D25)' };
  bankTotalRow.getCell('D').numFmt = '₹#,##,##0';
  bankTotalRow.getCell('E').value = { formula: '=SUM(E22:E25)' };
  bankTotalRow.getCell('E').numFmt = '₹#,##,##0';
  bankTotalRow.getCell('F').value = { formula: '=D26 / C26' };
  bankTotalRow.getCell('F').numFmt = '0.0%';

  wsDash.mergeCells('G26:M26');
  wsDash.getCell('G26').value = 'Total Credit Limit Available: ₹1,46,000';
  wsDash.getCell('G26').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: WHITE } };

  ['B', 'C', 'D', 'E', 'F'].forEach(col => {
    const c = bankTotalRow.getCell(col);
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    c.border = headerBorder;
    if (['C', 'D', 'E'].includes(col)) c.alignment = { horizontal: 'right', vertical: 'middle' };
    else if (col === 'F') c.alignment = { horizontal: 'center', vertical: 'middle' };
    else c.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  });
  for (let c = 7; c <= 13; c++) {
    bankTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    bankTotalRow.getCell(c).border = headerBorder;
  }

  // Debt Freedom Milestones (Roadmap)
  wsDash.mergeCells('B29:M29');
  const sec3 = wsDash.getCell('B29');
  sec3.value = '🎯 DEBT FREEDOM & CASHFLOW RELIEF ROADMAP (As Loans Get Closed)';
  sec3.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
  sec3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  sec3.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  wsDash.getRow(29).height = 24;

  const milestones = [
    { period: 'Dec 2026 - Jul 2027 (Next 8 Mo)', emi: '₹60,178 / mo', event: 'All 6 App Loans Active (Peak Outflow)', relief: 'Focus on paying on time, avoid high-cost delays' },
    { period: 'Aug 2027 (Month 9)', emi: '₹53,856 / mo', event: '🎉 MONEYVIEW CLOSED! (8 Months Done)', relief: 'Immediate cashflow relief of +₹6,322 / month!' },
    { period: 'Oct 2027 (Month 11)', emi: '₹44,353 / mo', event: '🎉 ADITYA BIRLA & KISHT CLOSED!', relief: 'Extra cashflow relief of +₹9,503 / month!' },
    { period: 'Nov 2027 (Month 12)', emi: '₹23,709 / mo', event: '🎉 FIBE CLOSED! (Biggest Relief)', relief: 'Massive cashflow relief of +₹20,644 / month!' },
    { period: 'Jun 2028 (Month 19)', emi: '₹7,716 / mo', event: '🎉 PERSONAL LOAN CLOSED!', relief: 'EMI drops to only Poonawalla! Saves +₹15,993 / month!' },
    { period: 'Jan 2029 (Month 26)', emi: '₹0 / mo', event: '🏆 100% DEBT FREE FROM APP LOANS! 🎉🎉', relief: 'Full ₹60,178 / month saved in your bank account!' },
  ];

  wsDash.mergeCells('B30:D30');
  wsDash.getCell('B30').value = 'Timeline / Period';
  wsDash.mergeCells('E30:F30');
  wsDash.getCell('E30').value = 'Monthly Outflow';
  wsDash.mergeCells('G30:I30');
  wsDash.getCell('G30').value = 'Milestone Event';
  wsDash.mergeCells('J30:M30');
  wsDash.getCell('J30').value = 'Cashflow Impact & Relief';

  ['B', 'E', 'G', 'J'].forEach(c => {
    const cell = wsDash.getCell(`${c}30`);
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  wsDash.getRow(30).height = 24;

  milestones.forEach((m, idx) => {
    const rNum = 31 + idx;
    const r = wsDash.getRow(rNum);
    r.height = 22;

    wsDash.mergeCells(`B${rNum}:D${rNum}`);
    wsDash.getCell(`B${rNum}`).value = m.period;
    wsDash.getCell(`B${rNum}`).font = { name: 'Segoe UI', size: 9, bold: true };

    wsDash.mergeCells(`E${rNum}:F${rNum}`);
    wsDash.getCell(`E${rNum}`).value = m.emi;
    wsDash.getCell(`E${rNum}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
    wsDash.getCell(`E${rNum}`).alignment = { horizontal: 'center', vertical: 'middle' };

    wsDash.mergeCells(`G${rNum}:I${rNum}`);
    wsDash.getCell(`G${rNum}`).value = m.event;
    wsDash.getCell(`G${rNum}`).font = { name: 'Segoe UI', size: 9, bold: idx >= 1, color: { argb: idx >= 3 ? 'FF15803D' : TEXT_DARK } };

    wsDash.mergeCells(`J${rNum}:M${rNum}`);
    wsDash.getCell(`J${rNum}`).value = m.relief;
    wsDash.getCell(`J${rNum}`).font = { name: 'Segoe UI', size: 9, italic: true };

    const bg = idx === milestones.length - 1 ? 'FFDCFCE7' : (idx % 2 === 0 ? WHITE : LIGHT_GRAY);
    for (let c = 2; c <= 13; c++) {
      r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(c).border = thinBorder;
    }
  });


  // -------------------------------------------------------------
  // SHEET 2: EMI PAYMENT TRACKER (WITH LOAN BANNERS & CHECKBOXES)
  // -------------------------------------------------------------
  const wsTracker = wb.addWorksheet('EMI Payment Tracker', {
    views: [{ showGridLines: true, freezePane: { ySplit: 4 } }]
  });

  wsTracker.columns = [
    { width: 4 },   // A: Margin
    { width: 22 },  // B: Loan Name
    { width: 14 },  // C: Installment #
    { width: 15 },  // D: Due Date
    { width: 16 },  // E: EMI Amount (₹)
    { width: 20 },  // F: Paid? [Checkbox / Status]
    { width: 15 },  // G: Paid Date
    { width: 20 },  // H: Remaining Loan Balance
    { width: 22 },  // I: Payment Mode / Ref
    { width: 24 },  // J: Remarks
  ];

  // Tracker Title Banner
  wsTracker.mergeCells('B2:J2');
  const trTitle = wsTracker.getCell('B2');
  trTitle.value = 'APP LOANS EMI REPAYMENT TRACKER (INTERACTIVE CHECKLIST)';
  trTitle.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: WHITE } };
  trTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  trTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsTracker.getRow(2).height = 36;

  wsTracker.mergeCells('B3:J3');
  const trSub = wsTracker.getCell('B3');
  trSub.value = 'Select "PAID" in Column F when you pay an EMI. Outstanding balance in Column H and the Dashboard will automatically decrease!';
  trSub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: WHITE } };
  trSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  trSub.alignment = { horizontal: 'center', vertical: 'middle' };
  wsTracker.getRow(3).height = 20;

  // Tracker Headers (Row 4)
  const trackerHeaders = [
    { col: 'B', title: 'App Loan Name' },
    { col: 'C', title: 'Installment #' },
    { col: 'D', title: 'Due Date 📅' },
    { col: 'E', title: 'EMI Amount (₹)' },
    { col: 'F', title: 'Paid? [Tick/Select] ✅' },
    { col: 'G', title: 'Paid Date ✍️' },
    { col: 'H', title: 'Remaining Loan Balance 📉' },
    { col: 'I', title: 'Payment Mode / UPI' },
    { col: 'J', title: 'Notes / Ref No' },
  ];

  trackerHeaders.forEach(h => {
    const cell = wsTracker.getCell(`${h.col}4`);
    cell.value = h.title;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;
  });
  wsTracker.getRow(4).height = 28;

  // Render Loan Sections
  loans.forEach((loan, loanIdx) => {
    const rng = loanRanges[loanIdx];
    const loanName = loan.name;
    const displayName = loan.displayName || loan.name;
    const startRemain = loan.amountRemaining;
    const emi = loan.emi;
    const totalTenure = loan.totalMonths;
    const completed = loan.completedMonths;

    // Loan Banner Row
    const bRow = wsTracker.getRow(rng.bannerRow);
    bRow.height = 24;
    wsTracker.mergeCells(`B${rng.bannerRow}:J${rng.bannerRow}`);
    const bCell = wsTracker.getCell(`B${rng.bannerRow}`);
    bCell.value = `📱 ${displayName.toUpperCase()}  |  Tenure: ${totalTenure} Mo (${loan.remainingMonths} Remaining)  |  EMI: ₹${emi.toLocaleString('en-IN')}  |  Starting Balance: ₹${startRemain.toLocaleString('en-IN')}  |  Rate: ${(loan.interest * 100).toFixed(2)}%`;
    bCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    bCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: loan.bannerColor || LOAN_BANNER_BG } };
    bCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    for (let c = 2; c <= 10; c++) {
      bRow.getCell(c).border = headerBorder;
    }

    // Data Rows
    for (let i = 0; i < loan.remainingMonths; i++) {
      const curRNum = rng.dataStartRow + i;
      const r = wsTracker.getRow(curRNum);
      r.height = 22;

      const instNumber = completed + i + 1;
      const dueDate = getDueDate(i);
      const isFirstRowOfLoan = (i === 0);

      // B: Loan Name
      r.getCell('B').value = loanName;
      r.getCell('B').font = { name: 'Segoe UI', size: 10, bold: isFirstRowOfLoan };
      r.getCell('B').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // C: Installment #
      r.getCell('C').value = `Month ${instNumber} / ${totalTenure}`;
      r.getCell('C').alignment = { horizontal: 'center', vertical: 'middle' };

      // D: Due Date
      r.getCell('D').value = dueDate;
      r.getCell('D').numFmt = 'YYYY-MM-DD';
      r.getCell('D').alignment = { horizontal: 'center', vertical: 'middle' };

      // E: EMI Amount
      r.getCell('E').value = emi;
      r.getCell('E').numFmt = '₹#,##,##0';
      r.getCell('E').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('E').font = { name: 'Segoe UI', size: 10, bold: true };

      // F: Status / Checkbox Dropdown
      r.getCell('F').value = 'PENDING';
      r.getCell('F').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('F').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PENDING_YELLOW_TXT } };
      r.getCell('F').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PENDING_YELLOW_BG } };

      r.getCell('F').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"PAID,PENDING"'],
        showErrorMessage: true,
        errorTitle: 'Invalid Status',
        error: 'Please choose either PAID or PENDING from the dropdown.'
      };

      // G: Paid Date
      r.getCell('G').value = '';
      r.getCell('G').numFmt = 'YYYY-MM-DD';
      r.getCell('G').alignment = { horizontal: 'center', vertical: 'middle' };

      // H: Remaining Loan Balance Formula:
      // Row 1: =MAX(0, StartOutstanding - IF(OR(F_row="PAID", F_row=TRUE), E_row, 0))
      // Row >1: =MAX(0, H_prev - IF(OR(F_row="PAID", F_row=TRUE), E_row, 0))
      if (isFirstRowOfLoan) {
        r.getCell('H').value = {
          formula: `MAX(0, ${startRemain} - IF(OR(F${curRNum}="PAID", F${curRNum}=TRUE), E${curRNum}, 0))`
        };
      } else {
        r.getCell('H').value = {
          formula: `MAX(0, H${curRNum - 1} - IF(OR(F${curRNum}="PAID", F${curRNum}=TRUE), E${curRNum}, 0))`
        };
      }
      r.getCell('H').numFmt = '₹#,##,##0';
      r.getCell('H').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('H').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };

      // I: Payment Mode
      r.getCell('I').value = '';
      r.getCell('I').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // J: Remarks
      r.getCell('J').value = '';
      r.getCell('J').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      const baseBg = i % 2 === 0 ? WHITE : LIGHT_GRAY;
      ['B', 'C', 'D', 'E', 'G', 'H', 'I', 'J'].forEach(col => {
        r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseBg } };
        r.getCell(col).border = thinBorder;
      });
      r.getCell('F').border = thinBorder;
    }
  });

  // Conditional Formatting for Tracker Status column F across all data rows
  wsTracker.addConditionalFormatting({
    ref: `F${trackerMinDataRow}:F${trackerMaxDataRow}`,
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"PAID"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: PAID_GREEN_BG } },
          font: { color: { argb: PAID_GREEN_TXT }, bold: true }
        }
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['TRUE'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: PAID_GREEN_BG } },
          font: { color: { argb: PAID_GREEN_TXT }, bold: true }
        }
      }
    ]
  });

  // Total Row at end of Tracker
  const trTotalRowIndex = trackerMaxDataRow + 1;
  const trTotal = wsTracker.getRow(trTotalRowIndex);
  trTotal.height = 28;
  trTotal.getCell('B').value = 'GRAND TOTAL (ALL EMIs)';
  trTotal.getCell('C').value = '82 EMIs';
  trTotal.getCell('D').value = 'Dec-26 to Dec-28';
  trTotal.getCell('E').value = { formula: `=SUM(E${trackerMinDataRow}:E${trackerMaxDataRow})` };
  trTotal.getCell('E').numFmt = '₹#,##,##0';
  trTotal.getCell('F').value = { formula: `="PAID: " & (COUNTIF(F${trackerMinDataRow}:F${trackerMaxDataRow}, "PAID") + COUNTIF(F${trackerMinDataRow}:F${trackerMaxDataRow}, TRUE)) & " / 82"` };
  trTotal.getCell('G').value = '-';
  trTotal.getCell('H').value = { formula: `="Total Paid: ₹" & TEXT(SUMIFS(E${trackerMinDataRow}:E${trackerMaxDataRow}, F${trackerMinDataRow}:F${trackerMaxDataRow}, "PAID") + SUMIFS(E${trackerMinDataRow}:E${trackerMaxDataRow}, F${trackerMinDataRow}:F${trackerMaxDataRow}, TRUE), "#,##,##0")` };
  trTotal.getCell('I').value = '';
  trTotal.getCell('J').value = 'Formula Auto-Calculated';

  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
    const c = trTotal.getCell(col);
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    c.border = headerBorder;
    if (col === 'E') c.alignment = { horizontal: 'right', vertical: 'middle' };
    else c.alignment = { horizontal: 'center', vertical: 'middle' };
  });


  // -------------------------------------------------------------
  // SHEET 3: MONTHLY MASTER CALENDAR (CHRONOLOGICAL OUTFLOW)
  // -------------------------------------------------------------
  const wsMonth = wb.addWorksheet('📅 Monthly EMI Calendar', {
    views: [{ showGridLines: true, freezePane: { ySplit: 4 } }]
  });

  wsMonth.columns = [
    { width: 4 },   // A: Margin
    { width: 14 },  // B: Month & Year
    { width: 14 },  // C: Due Date
    { width: 18 },  // D: App Loan Name
    { width: 14 },  // E: Installment #
    { width: 16 },  // F: EMI Amount (₹)
    { width: 18 },  // G: Monthly Total Outflow (₹)
    { width: 18 },  // H: Status (Links to Tracker)
    { width: 22 },  // I: Action / Notes
  ];

  // Calendar Header Banner
  wsMonth.mergeCells('B2:I2');
  const calTitle = wsMonth.getCell('B2');
  calTitle.value = 'MONTHLY EMI CASHFLOW CALENDAR (ALL LOANS BY MONTH)';
  calTitle.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: WHITE } };
  calTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  calTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsMonth.getRow(2).height = 36;

  wsMonth.mergeCells('B3:I3');
  const calSub = wsMonth.getCell('B3');
  calSub.value = 'Chronological view of monthly commitments. Shows how your monthly EMI reduces as loans are closed!';
  calSub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: WHITE } };
  calSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MED } };
  calSub.alignment = { horizontal: 'center', vertical: 'middle' };
  wsMonth.getRow(3).height = 20;

  const calHeaders = [
    { col: 'B', title: 'Month-Year' },
    { col: 'C', title: 'Due Date' },
    { col: 'D', title: 'Loan Name' },
    { col: 'E', title: 'EMI #' },
    { col: 'F', title: 'EMI Amount (₹)' },
    { col: 'G', title: 'Total Due in Month' },
    { col: 'H', title: 'Status' },
    { col: 'I', title: 'Closure Alert' },
  ];

  calHeaders.forEach(h => {
    const cell = wsMonth.getCell(`${h.col}4`);
    cell.value = h.title;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = headerBorder;
  });
  wsMonth.getRow(4).height = 28;

  let calRow = 5;

  for (let m = 0; m < 25; m++) {
    const monthLabel = getMonthLabel(m);
    const dueDate = getDueDate(m);

    const activeInMonth = [];
    loans.forEach(loan => {
      if (m < loan.remainingMonths) {
        activeInMonth.push({
          loanName: loan.name,
          emi: loan.emi,
          inst: loan.completedMonths + m + 1,
          totalInst: loan.totalMonths,
          isLast: (m === loan.remainingMonths - 1)
        });
      }
    });

    const monthStartRow = calRow;
    const monthlyTotal = activeInMonth.reduce((acc, curr) => acc + curr.emi, 0);

    activeInMonth.forEach((item, itemIdx) => {
      const r = wsMonth.getRow(calRow);
      r.height = 22;

      if (itemIdx === 0) {
        r.getCell('B').value = monthLabel;
        r.getCell('B').font = { name: 'Segoe UI', size: 10, bold: true };
      } else {
        r.getCell('B').value = '';
      }
      r.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };

      r.getCell('C').value = dueDate;
      r.getCell('C').numFmt = 'YYYY-MM-DD';
      r.getCell('C').alignment = { horizontal: 'center', vertical: 'middle' };

      r.getCell('D').value = item.loanName;
      r.getCell('D').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      r.getCell('D').font = { name: 'Segoe UI', size: 10, bold: true };

      r.getCell('E').value = `${item.inst}/${item.totalInst}`;
      r.getCell('E').alignment = { horizontal: 'center', vertical: 'middle' };

      r.getCell('F').value = item.emi;
      r.getCell('F').numFmt = '₹#,##,##0';
      r.getCell('F').alignment = { horizontal: 'right', vertical: 'middle' };

      if (itemIdx === 0) {
        r.getCell('G').value = monthlyTotal;
        r.getCell('G').numFmt = '₹#,##,##0';
        r.getCell('G').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
      } else {
        r.getCell('G').value = '';
      }
      r.getCell('G').alignment = { horizontal: 'right', vertical: 'middle' };

      r.getCell('H').value = 'See Tracker Tab';
      r.getCell('H').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('H').font = { name: 'Segoe UI', size: 9, italic: true };

      if (item.isLast) {
        r.getCell('I').value = `FINAL EMI! Loan Closed 🎉`;
        r.getCell('I').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
      } else {
        r.getCell('I').value = '';
      }
      r.getCell('I').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      const baseBg = m % 2 === 0 ? WHITE : LIGHT_GRAY;
      ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
        r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseBg } };
        r.getCell(col).border = thinBorder;
      });

      calRow++;
    });

    if (activeInMonth.length > 1) {
      const monthEndRow = calRow - 1;
      wsMonth.mergeCells(`B${monthStartRow}:B${monthEndRow}`);
      wsMonth.mergeCells(`G${monthStartRow}:G${monthEndRow}`);
    }
  }


  // -------------------------------------------------------------
  // SHEET 4: HOW TO USE / GUIDE (HINDI + ENGLISH)
  // -------------------------------------------------------------
  const wsGuide = wb.addWorksheet('📖 User Guide (Hinglish)', {
    views: [{ showGridLines: true }]
  });

  wsGuide.columns = [
    { width: 4 },
    { width: 30 },
    { width: 75 },
  ];

  wsGuide.mergeCells('B2:C2');
  const gTitle = wsGuide.getCell('B2');
  gTitle.value = 'LOAN MANAGEMENT EXCEL SHEET - USE KAISE KAREIN (GUIDE)';
  gTitle.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: WHITE } };
  gTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  gTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsGuide.getRow(2).height = 36;

  const instructions = [
    {
      topic: '1. EMI Tick / Checkbox Kaise Karein?',
      detail: '"EMI Payment Tracker" sheet me jayein. Wahan har loan ke samne Column F ("Paid? [Tick/Select]") me dropdown diya hua hai. Jaise hi aap "PAID" select karenge, outstanding turant minus ho jayegi.'
    },
    {
      topic: '2. Excel 365 / Google Sheets Checkbox Support',
      detail: 'Agar aap modern Excel (Microsoft 365) ya Google Sheets use kar rahe hain, toh Column F me checkbox tick karne par cell value TRUE ho jati hai. Humare formulas "PAID" aur TRUE dono ko auto-detect karke amount minus karte hain!'
    },
    {
      topic: '3. Dashboard Par Live Changes',
      detail: '"Overview & Dashboard" sheet par har loan ka Remaining Balance, Remaining Months aur Total Paid live update hota hai. Top summary cards me Total Outstanding bhi dynamically kam hota rehta hai.'
    },
    {
      topic: '4. Due Date Change Karni Ho Toh?',
      detail: '"EMI Payment Tracker" sheet ke Column D (Due Date) me default me har mahine ki 5 tareekh dali hai. Agar kisi loan ki EMI 2, 7 ya 10 tareekh ko kat ti hai toh aap wahan direct date edit kar sakte hain.'
    },
    {
      topic: '5. Paid Date & Payment Mode Record Karna',
      detail: 'Payment hone ke baad Column G me actual payment date aur Column I me UPI / Netbanking / Auto Debit ka reference daal kar record maintain kar sakte hain.'
    },
    {
      topic: '6. Cashflow Relief Roadmap (Kab Konsa Loan Khatam Hoga?)',
      detail: '• Aug 2027: Moneyview khatam! (₹6,322/mo bachega)\n• Oct 2027: Aditya Birla & Kisht khatam! (₹9,503/mo aur bachega)\n• Nov 2027: Fibe khatam! (₹20,644/mo ka bada relief)\n• Jun 2028: Personal Loan khatam! (₹15,993/mo aur bachega)\n• Jan 2029: Poonawalla khatam! 100% Karz Mukt! 🎉'
    },
    {
      topic: '7. Bank Cards Ka Kya Karein?',
      detail: 'ICICI Bank ka ₹80,000 pura utilized hai. Ise priority par pay karne ki strategy rakhein taaki high interest aur CIBIL score damage se bacha ja sake.'
    }
  ];

  wsGuide.getCell('B4').value = 'Topic / Saval';
  wsGuide.getCell('C4').value = 'Details / Solution';
  ['B', 'C'].forEach(col => {
    const cell = wsGuide.getCell(`${col}4`);
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = headerBorder;
  });
  wsGuide.getRow(4).height = 26;

  instructions.forEach((ins, idx) => {
    const rNum = 5 + idx;
    const r = wsGuide.getRow(rNum);
    r.height = ins.detail.includes('\n') ? 75 : 38;

    r.getCell('B').value = ins.topic;
    r.getCell('B').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('B').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    r.getCell('C').value = ins.detail;
    r.getCell('C').font = { name: 'Segoe UI', size: 10 };
    r.getCell('C').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };

    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    ['B', 'C'].forEach(col => {
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(col).border = thinBorder;
    });
  });

  const outputPath = path.resolve('Loan_Management_EMI_Tracker.xlsx');
  await wb.xlsx.writeFile(outputPath);
  console.log('Saved enhanced workbook to:', outputPath);
}

generateLoanWorkbook().catch(err => {
  console.error('Error generating workbook:', err);
  process.exit(1);
});
