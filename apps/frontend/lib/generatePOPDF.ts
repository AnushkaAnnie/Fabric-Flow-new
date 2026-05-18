export async function generatePOPDF(poNumber: string) {
  const element = document.getElementById('po-print');
  if (!element) return;

  try {
    // Dynamically import html2pdf.js on the client-side to prevent SSR ReferenceError
    // @ts-ignore
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
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    };

    await html2pdf()
      .set(options)
      .from(element)
      .save();
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}
