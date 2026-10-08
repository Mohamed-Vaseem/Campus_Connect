import { fmtDateTime } from './format';

/**
 * Builds and downloads an .xlsx workbook (opens in Excel and Google Sheets).
 * sheets: [{ name: 'Registrations', rows: [{ Column: value, ... }] }]
 * The spreadsheet library is loaded only when someone actually exports.
 */
export async function exportWorkbook(filename, sheets) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const data = rows.length ? rows : [{ Note: 'No records yet' }];
    const ws = XLSX.utils.json_to_sheet(data);
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map((k) => ({ wch: Math.min(48, Math.max(k.length, ...data.map((r) => String(r[k] ?? '').length)) + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}-${stamp}.xlsx`);
}

// ---- row builders shared by the pages ----
const yes = (b) => (b ? 'Yes' : 'No');

export const registrationRows = (list) => list.map((r) => ({
  Event: r.eventTitle,
  'Event date': r.eventDate,
  'Student name': r.studentName,
  'Roll number': r.rollNumber || '',
  Department: r.department || '',
  Year: r.yearOfStudy || '',
  Email: r.email,
  'Mobile number': r.mobileNumber || '',
  'Team name': r.teamName || '',
  'Team members': r.teamMembers || '',
  Status: r.status,
  'Registered at': fmtDateTime(r.registeredAt),
  Attended: yes(r.attended),
  'Checked in at': fmtDateTime(r.attendedAt),
}));

export const eventRegistrantRows = (event, people) => people.map((p) => ({
  Event: event.title,
  'Event date': event.eventDate,
  'Student name': p.student.name,
  'Roll number': p.student.rollNumber || '',
  Department: p.student.department || '',
  Year: p.student.yearOfStudy || '',
  Email: p.student.email,
  'Mobile number': p.mobileNumber || '',
  'Team name': p.teamName || '',
  'Team members': (p.teamMembers || []).map((m) => `${m.name} (Y${m.yearOfStudy})`).join('; '),
  Status: p.status,
  'Registered at': fmtDateTime(p.registrationDate),
  Attended: yes(p.attended),
  'Checked in at': fmtDateTime(p.attendedAt),
}));

export const studentRows = (list) => list.map((u) => ({
  Name: u.name, Email: u.email, 'Roll number': u.rollNumber || '', Department: u.department || '',
  Year: u.yearOfStudy || '', Joined: fmtDateTime(u.createdAt), Active: yes(u.active),
}));

export const pointsReportRows = (report) => report.rows.map((r) => ({
  Name: r.name, 'Roll number': r.rollNumber || '', Department: r.department || '', Year: r.yearOfStudy || '',
  Email: r.email, Semester: report.semester, 'Total points': r.total, [`Target (${report.target})`]: r.meetsTarget ? 'Met' : 'Not yet',
  Breakdown: r.breakdown.map((b) => `${b.label}: ${b.points}`).join('; '),
}));

export const ledgerRows = (list) => list.map((p) => ({
  Semester: p.semester, Student: p.studentName, 'Roll number': p.rollNumber || '', Event: p.eventTitle || '(semester)',
  Category: p.label, Points: p.points, 'How awarded': p.auto ? 'Automatic (attendance)' : 'By coordinator',
  Note: p.note || '', 'Awarded at': fmtDateTime(p.awardedAt),
}));

export const historyRows = (list) => list.map((a) => ({
  When: fmtDateTime(a.createdAt), Who: a.actorName || '', Email: a.actorEmail || '', Action: a.action,
  Type: a.entityType || '', 'Record id': a.entityId ?? '', Details: a.details || '',
}));
