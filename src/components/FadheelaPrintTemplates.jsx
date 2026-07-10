import React from 'react';

export const FadheelaPrintTemplates = ({ data }) => {
  if (!data) return null;

  const totalCount = data.timetable.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="print-container" style={{ display: 'none' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .app-container, .app-sidebar, .content-header, .no-print {
            display: none !important;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break {
            page-break-after: always;
          }
          .print-page {
            padding: 40px;
            min-height: 100vh;
            box-sizing: border-box;
            background: white;
            color: black;
          }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .justify-between { justify-content: space-between; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .uppercase { text-transform: uppercase; }
          .border-4 { border: 4px solid black; }
          .border-b { border-bottom: 1px solid black; }
          .border { border: 1px solid black; }
          .border-collapse { border-collapse: collapse; }
          .w-full { width: 100%; }
          .w-48 { width: 12rem; }
          .w-16 { width: 4rem; }
          .w-32 { width: 8rem; }
          .w-40 { width: 10rem; }
          .w-24 { width: 6rem; }
          .max-w-2xl { max-width: 42rem; }
          .m-8 { margin: 2rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .mt-12 { margin-top: 3rem; }
          .mt-16 { margin-top: 4rem; }
          .mt-20 { margin-top: 5rem; }
          .mt-32 { margin-top: 8rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-8 { margin-bottom: 2rem; }
          .pb-2 { padding-bottom: 0.5rem; }
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .p-8 { padding: 2rem; }
          .px-10 { padding-left: 2.5rem; padding-right: 2.5rem; }
          .space-y-6 > * + * { margin-top: 1.5rem; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-4 { gap: 1rem; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .text-lg { font-size: 1.125rem; }
          .text-xl { font-size: 1.25rem; }
          .text-2xl { font-size: 1.5rem; }
          .text-3xl { font-size: 1.875rem; }
          .text-4xl { font-size: 2.25rem; }
          .text-gray-500 { color: #6b7280; }
          .h-10 { height: 2.5rem; }
          .h-8 { height: 2rem; }
        }
      `}</style>

      {/* 1. Pack Cover Data */}
      <div className="print-page page-break flex flex-col items-center justify-center text-center border-4 border-black m-8">
        <h1 className="text-4xl font-bold uppercase mb-8">Fadheela PG Examination {data.year}</h1>
        <h2 className="text-3xl font-semibold mb-4">Pack Cover</h2>
        
        <div className="w-full max-w-2xl mt-12 text-left space-y-6 text-xl" style={{ margin: '3rem auto' }}>
          <div className="flex justify-between border-b border-black pb-2">
            <span className="font-bold">Exam Center:</span>
            <span className="uppercase">{data.centerName || '________________________'}</span>
          </div>
          <div className="flex justify-between border-b border-black pb-2">
            <span className="font-bold">Department:</span>
            <span className="uppercase">{data.departmentName || '________________________'}</span>
          </div>
          <div className="flex justify-between border-b border-black pb-2">
            <span className="font-bold">Total Subjects:</span>
            <span className="font-bold">{data.timetable.length}</span>
          </div>
          <div className="flex justify-between border-b border-black pb-2">
            <span className="font-bold">Total Answer Scripts Expected:</span>
            <span className="font-bold">{totalCount}</span>
          </div>
        </div>

        <div className="mt-32 w-full max-w-2xl flex justify-between" style={{ margin: '8rem auto 0 auto' }}>
          <div className="text-center">
            <div className="border-b border-black w-48 h-10 mb-2"></div>
            <span className="font-bold">Center Chief / Invigilator</span>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-48 h-10 mb-2"></div>
            <span className="font-bold">Date & Seal</span>
          </div>
        </div>
      </div>

      {/* 2. Admin Cover with Checklist */}
      <div className="print-page page-break">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">Fadheela PG Examination {data.year}</h1>
          <h2 className="text-2xl font-semibold mt-2">Admin Cover & Documents Checklist</h2>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 text-lg">
          <div><span className="font-bold">Center:</span> {data.centerName}</div>
          <div><span className="font-bold">Department:</span> {data.departmentName}</div>
        </div>

        <h3 className="text-xl font-bold mb-4">Enclosed Documents Checklist</h3>
        <table className="w-full border-collapse border border-black text-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-3 text-left w-16">Sl No</th>
              <th className="border border-black p-3 text-left">Document Details</th>
              <th className="border border-black p-3 text-center w-24">Enclosed (Yes/No)</th>
              <th className="border border-black p-3 text-center w-32">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {[
              "Question Papers (Sealed)",
              "Blank Answer Booklets",
              "Attendance Sheets",
              "Invigilator Diaries",
              "Seating Arrangement Plan",
              "Malpractice Report Forms",
              "Unused Question Papers Cover",
              "Used Answer Scripts Cover (Sealed)"
            ].map((item, idx) => (
              <tr key={idx}>
                <td className="border border-black p-3 text-center">{idx + 1}</td>
                <td className="border border-black p-3">{item}</td>
                <td className="border border-black p-3 text-center"></td>
                <td className="border border-black p-3 text-center"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-20 flex justify-between px-10">
          <div className="text-center">
            <div className="border-b border-black w-48 h-10 mb-2"></div>
            <span className="font-bold">Handed Over By</span>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-48 h-10 mb-2"></div>
            <span className="font-bold">Received By</span>
          </div>
        </div>
      </div>

      {/* 3. Schedule & Seating */}
      <div className="print-page page-break">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">Fadheela PG Examination {data.year}</h1>
          <h2 className="text-2xl font-semibold mt-2">Schedule & Seating Plan</h2>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 text-lg">
          <div><span className="font-bold">Center:</span> {data.centerName}</div>
          <div><span className="font-bold">Department:</span> {data.departmentName}</div>
        </div>

        <table className="w-full border-collapse border border-black text-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-3 text-left">Date</th>
              <th className="border border-black p-3 text-left">Time</th>
              <th className="border border-black p-3 text-left">Subject</th>
              <th className="border border-black p-3 text-center">Student Count</th>
              <th className="border border-black p-3 text-left w-48">Allocated Room(s)</th>
            </tr>
          </thead>
          <tbody>
            {data.timetable.map((t, idx) => (
              <tr key={idx}>
                <td className="border border-black p-3 font-medium">{t.date}</td>
                <td className="border border-black p-3">{t.time}</td>
                <td className="border border-black p-3 font-bold">{t.subject}</td>
                <td className="border border-black p-3 text-center font-bold text-xl">{t.count}</td>
                <td className="border border-black p-3"></td>
              </tr>
            ))}
            {data.timetable.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-black p-8 text-center text-gray-500">
                  No schedule added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Attendance Sheets (One per Subject) */}
      {data.timetable.map((subject, sIdx) => (
        <div key={`att-${sIdx}`} className="print-page page-break">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase">Fadheela PG Examination {data.year}</h1>
            <h2 className="text-xl font-semibold mt-2">Attendance Sheet</h2>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 border p-4 border-black">
            <div><span className="font-bold">Center:</span> {data.centerName}</div>
            <div><span className="font-bold">Department:</span> {data.departmentName}</div>
            <div><span className="font-bold">Subject:</span> {subject.subject}</div>
            <div><span className="font-bold">Date & Time:</span> {subject.date} | {subject.time}</div>
          </div>

          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-16">Sl No</th>
                <th className="border border-black p-2 w-40">Register Number</th>
                <th className="border border-black p-2 text-left">Candidate Name</th>
                <th className="border border-black p-2 w-32">Signature</th>
                <th className="border border-black p-2 w-32">Ans. Script No.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: subject.count }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td className="border border-black p-2 text-center">{rIdx + 1}</td>
                  <td className="border border-black p-2 h-10"></td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-16 flex justify-between px-10">
            <div className="text-center">
              <span className="font-bold">Total Present: ____________</span>
            </div>
            <div className="text-center">
              <span className="font-bold">Total Absent: ____________</span>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-48 h-8 mb-2"></div>
              <span className="font-bold">Invigilator Signature</span>
            </div>
          </div>
        </div>
      ))}

    </div>
  );
};
