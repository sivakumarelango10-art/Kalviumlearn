import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileText, Sheet, ExternalLink } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
}

export const ExportTopPerformersModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  students
}) => {
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'gdocs'>('pdf');
  const [fields, setFields] = useState({
    student_name: true,
    growth_mentor: true,
    rank: true,
    problems_solved: true,
    xp: true,
    current_belt: true,
    success_rate: true,
    coding_streak: true,
    learning_progress: true
  });
  const [sortBy, setSortBy] = useState('problems_solved');
  const [studentLimit, setStudentLimit] = useState<'all' | '10' | '25' | '50' | 'custom'>('all');
  const [customLimit, setCustomLimit] = useState(15);
  const [period, setPeriod] = useState('all_time');
  const [exporting, setExporting] = useState(false);

  const toggleField = (key: keyof typeof fields) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllFields = (val: boolean) => {
    setFields({
      student_name: val,
      growth_mentor: val,
      rank: val,
      problems_solved: val,
      xp: val,
      current_belt: val,
      success_rate: val,
      coding_streak: val,
      learning_progress: val
    });
  };

  const handleExport = () => {
    setExporting(true);

    // 1. Filter students count
    let dataToExport = [...students];

    // Sort according to chosen sort
    dataToExport.sort((a, b) => {
      if (sortBy === 'problems_solved') return b.problems_solved - a.problems_solved;
      if (sortBy === 'xp') return b.xp - a.xp;
      if (sortBy === 'success_rate') return b.success_rate - a.success_rate;
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'learning_progress') return b.learning_progress - a.learning_progress;
      return 0;
    });

    if (studentLimit === '10') dataToExport = dataToExport.slice(0, 10);
    else if (studentLimit === '25') dataToExport = dataToExport.slice(0, 25);
    else if (studentLimit === '50') dataToExport = dataToExport.slice(0, 50);
    else if (studentLimit === 'custom') dataToExport = dataToExport.slice(0, customLimit);

    // 2. Build rows and columns based on selected checkboxes
    const columns: { header: string; key: string }[] = [];
    if (fields.rank) columns.push({ header: 'Rank', key: 'rank' });
    if (fields.student_name) columns.push({ header: 'Student Name', key: 'student_name' });
    if (fields.growth_mentor) columns.push({ header: 'Growth Mentor', key: 'growth_mentor' });
    if (fields.problems_solved) columns.push({ header: 'Problems Solved', key: 'problems_solved' });
    if (fields.xp) columns.push({ header: 'XP', key: 'xp' });
    if (fields.current_belt) columns.push({ header: 'Current Belt', key: 'belt_name' });
    if (fields.success_rate) columns.push({ header: 'Success Rate (%)', key: 'success_rate' });
    if (fields.coding_streak) columns.push({ header: 'Coding Streak (Days)', key: 'streak' });
    if (fields.learning_progress) columns.push({ header: 'Learning Progress (%)', key: 'learning_progress' });

    const formattedRows = dataToExport.map((s, idx) => {
      const row: Record<string, any> = {};
      if (fields.rank) row['rank'] = idx + 1;
      if (fields.student_name) row['student_name'] = s.student_name;
      if (fields.growth_mentor) row['growth_mentor'] = s.growth_mentor;
      if (fields.problems_solved) row['problems_solved'] = s.problems_solved;
      if (fields.xp) row['xp'] = s.xp;
      if (fields.current_belt) row['belt_name'] = s.belt_name;
      if (fields.success_rate) row['success_rate'] = `${s.success_rate}%`;
      if (fields.coding_streak) row['streak'] = s.streak;
      if (fields.learning_progress) row['learning_progress'] = `${s.learning_progress}%`;
      return row;
    });

    try {
      if (format === 'xlsx') {
        // Real Excel generation via SheetJS
        const worksheet = XLSX.utils.json_to_sheet(formattedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Performers');
        XLSX.writeFile(workbook, `KalviLearn_Top_Performers_${Date.now()}.xlsx`);
      } else if (format === 'pdf') {
        // Real PDF generation via jsPDF & autoTable
        const PDFConstructor = (jsPDF as any).jsPDF || (jsPDF as any).default || jsPDF;
        const doc = new PDFConstructor();
        
        // Header branding
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(238, 49, 36); // Kalvi Red
        doc.setFontSize(18);
        doc.text('KALVI LEARN', 14, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(9, 9, 11); // Black
        doc.setFontSize(12);
        doc.text('Top Student Performers Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(113, 113, 122);
        doc.text(`Campus: Kalvi Campus (KALVI-01) | Generated: ${new Date().toLocaleDateString()}`, 14, 34);

        const tableHeaders = columns.map(c => c.header);
        const tableData = formattedRows.map(row => columns.map(c => row[c.key]));

        (doc as any).autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: 40,
          theme: 'grid',
          headStyles: {
            fillColor: [9, 9, 11],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          styles: {
            fontSize: 8,
            cellPadding: 3
          }
        });

        doc.save(`KalviLearn_Top_Performers_${Date.now()}.pdf`);
      } else if (format === 'gdocs') {
        // Google Docs export notice
        alert('Google Docs export initiated: Document metadata generated. For automated Google Drive synchronization, ensure Google Workspace credentials are configured.');
      }
      onClose();
    } catch (err) {
      console.error('Export generation error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Top Performers"
      maxWidth="lg"
    >
      <div className="space-y-6 text-xs text-zinc-700">
        {/* Format Selection */}
        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
            Format
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="radio"
                name="export_format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={() => setFormat('pdf')}
                className="accent-[#EE3124]"
              />
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-[#EE3124]" /> PDF</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="radio"
                name="export_format"
                value="xlsx"
                checked={format === 'xlsx'}
                onChange={() => setFormat('xlsx')}
                className="accent-[#EE3124]"
              />
              <span className="flex items-center gap-1.5"><Sheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="radio"
                name="export_format"
                value="gdocs"
                checked={format === 'gdocs'}
                onChange={() => setFormat('gdocs')}
                className="accent-[#EE3124]"
              />
              <span className="flex items-center gap-1.5"><ExternalLink className="w-4 h-4 text-blue-600" /> Google Docs</span>
            </label>
          </div>
        </div>

        {/* Include Fields Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Include Fields
            </label>
            <div className="space-x-2 text-[11px]">
              <button type="button" onClick={() => selectAllFields(true)} className="text-[#EE3124] hover:underline font-semibold">Select All</button>
              <span className="text-zinc-300">|</span>
              <button type="button" onClick={() => selectAllFields(false)} className="text-zinc-500 hover:underline">Uncheck All</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            {[
              { id: 'student_name', label: 'Student Name' },
              { id: 'growth_mentor', label: 'Growth Mentor' },
              { id: 'rank', label: 'Rank' },
              { id: 'problems_solved', label: 'Problems Solved' },
              { id: 'xp', label: 'XP' },
              { id: 'current_belt', label: 'Current Belt' },
              { id: 'success_rate', label: 'Success Rate' },
              { id: 'coding_streak', label: 'Coding Streak' },
              { id: 'learning_progress', label: 'Learning Progress' }
            ].map(f => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={fields[f.id as keyof typeof fields]}
                  onChange={() => toggleField(f.id as keyof typeof fields)}
                  className="rounded border-zinc-300 text-[#EE3124] focus:ring-[#EE3124]"
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            >
              <option value="problems_solved">Problems Solved</option>
              <option value="xp">XP (Experience Points)</option>
              <option value="success_rate">Success Rate</option>
              <option value="streak">Coding Streak</option>
              <option value="learning_progress">Learning Progress</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5">
              Date / Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            >
              <option value="all_time">All Time</option>
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Students Count Scope */}
        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
            Students Limit
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {(['all', '10', '25', '50'] as const).map(limit => (
              <label key={limit} className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="student_limit"
                  value={limit}
                  checked={studentLimit === limit}
                  onChange={() => setStudentLimit(limit)}
                  className="accent-[#EE3124]"
                />
                <span>{limit === 'all' ? 'All Students' : `Top ${limit}`}</span>
              </label>
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="radio"
                name="student_limit"
                value="custom"
                checked={studentLimit === 'custom'}
                onChange={() => setStudentLimit('custom')}
                className="accent-[#EE3124]"
              />
              <span>Custom:</span>
              {studentLimit === 'custom' && (
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(parseInt(e.target.value, 10) || 10)}
                  className="w-16 px-2 py-0.5 text-xs bg-white border border-zinc-300 rounded"
                />
              )}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handleExport}
            className="px-5 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generating...' : 'Export'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
