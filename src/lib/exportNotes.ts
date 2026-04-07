import { Note, formatDate } from './calendar-utils';

/**
 * Exports notes to a readable text format organized by monthly and selected date notes
 */
export function exportNotesToText(notes: Note[]): string {
  const generalNotes = notes.filter(n => !n.date);
  const dateNotes = notes.filter(n => n.date);

  let content = '=============================================================\n';
  content += '                 SERENE CALENDAR - NOTES\n';
  content += '=============================================================\n\n';

  if (generalNotes.length > 0) {
    content += '-------------------------------------------------------------\n';
    content += '                      MONTHLY NOTES\n';
    content += '-------------------------------------------------------------\n\n';
    
    const groupedByMonth: Record<string, Note[]> = {};
    generalNotes.forEach(note => {
      const date = new Date(note.createdAt);
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (!groupedByMonth[key]) groupedByMonth[key] = [];
      groupedByMonth[key].push(note);
    });

    Object.keys(groupedByMonth).sort().reverse().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      content += monthName + '\n';
      content += '-------------------------------------\n';
      groupedByMonth[monthKey].forEach((note, idx) => {
        const noteDate = new Date(note.createdAt);
        content += '  ' + (idx + 1) + '. ' + note.content + '\n';
        content += '     Created: ' + noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '\n\n';
      });
    });
  }

  if (dateNotes.length > 0) {
    content += '\n-------------------------------------------------------------\n';
    content += '                    SELECTED DATE NOTES\n';
    content += '-------------------------------------------------------------\n\n';

    dateNotes.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    
    let currentDate = '';
    dateNotes.forEach((note, idx) => {
      const noteDateStr = note.date ? formatDate(note.date) : '';
      if (noteDateStr !== currentDate) {
        currentDate = noteDateStr;
        content += noteDateStr + '\n';
        content += '-------------------------------------\n';
      }
      content += '  * ' + note.content + '\n\n';
    });
  }

  if (generalNotes.length === 0 && dateNotes.length === 0) {
    content += 'No notes to export.\n';
  }

  content += '\n=============================================================\n';
  content += 'Exported on: ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '\n';

  return content;
}

/**
 * Triggers download of notes as a text file
 */
export function downloadNotesAsText(notes: Note[]): void {
  const content = exportNotesToText(notes);
  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'serene-calendar-notes-' + dateStr + '.txt';
  link.click();
  URL.revokeObjectURL(url);
}
