/**
 * Generates a PDF from a specific DOM element.
 *
 * @param elementId - The exact DOM id of the element to capture.
 * @param poNumber  - Used as the downloaded filename.
 */
export async function generatePOPDF(elementId: string, poNumber: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`generatePOPDF: element with id "${elementId}" not found in DOM`);
  }

  // Dynamically import html2pdf.js on the client-side to prevent SSR ReferenceError
  const html2pdf = (await import('html2pdf.js')).default;

  const options = {
    margin: 5,
    filename: `PO_${poNumber}.pdf`,
    image: {
      type: 'jpeg' as const,
      quality: 1,
    },
    html2canvas: {
      scale: 2,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'landscape' as const,
    },
  };

  await html2pdf()
    .set(options)
    .from(element)
    .save();
}
