/* ============================================================
   EXPORTER — real export functionality for the active module
   ============================================================ */

const Exporter = {
  _target() { return document.getElementById("mainContent"); },

  async pdf() {
    Utils.toast("Generating PDF…", "info");
    const node = this._target();
    const canvas = await html2canvas(node, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg"), scale: 2 });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save(`${App.currentModule}-report.pdf`);
    Utils.toast("PDF downloaded", "success");
  },

  async png() {
    Utils.toast("Rendering snapshot…", "info");
    const canvas = await html2canvas(this._target(), { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg"), scale: 2 });
    const link = document.createElement("a");
    link.download = `${App.currentModule}-snapshot.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    Utils.toast("Snapshot saved", "success");
  },

  csv() {
    const table = this._target().querySelector("table.data-table");
    if (!table) return Utils.toast("No table found in this module", "error");
    const rows = Utils.qsa("tr", table).map((tr) => Utils.qsa("th,td", tr).map((td) => `"${td.textContent.trim().replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${App.currentModule}-data.csv`;
    link.click();
    Utils.toast("CSV downloaded", "success");
  },

  excel() {
    const table = this._target().querySelector("table.data-table");
    if (!table) return Utils.toast("No table found in this module", "error");
    const wb = XLSX.utils.table_to_book(table, { sheet: App.modules[App.currentModule].label.slice(0, 31) });
    XLSX.writeFile(wb, `${App.currentModule}-data.xlsx`);
    Utils.toast("Excel file downloaded", "success");
  },

  print() {
    window.print();
  },
};
