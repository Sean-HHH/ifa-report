import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const A4_W = 210  // mm
const A4_H = 297  // mm
const MARGIN = 10 // mm

export async function exportToPDF(clientName: string): Promise<void> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>('.report-page'))
  if (pages.length === 0) return

  const container = document.querySelector<HTMLElement>('[data-print-content]')
  let savedOverflowY = ''
  if (container) {
    savedOverflowY = container.style.overflowY
    container.style.overflowY = 'visible'
  }

  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const cw = A4_W - MARGIN * 2  // content width mm
    const ch = A4_H - MARGIN * 2  // content height per page mm
    let first = true

    for (const el of pages) {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const imgH = (canvas.height / canvas.width) * cw  // mm

      if (!first) pdf.addPage()
      first = false

      pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN, cw, imgH)

      // 若 section 高於單頁，繼續往後頁放
      let yShift = ch
      while (yShift < imgH - 0.5) {
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN - yShift, cw, imgH)
        yShift += ch
      }
    }

    const safeName = clientName.replace(/[/\\?%*:|"<>]/g, '_') || 'IFA報告'
    pdf.save(`${safeName}.pdf`)
  } finally {
    if (container) container.style.overflowY = savedOverflowY
  }
}
