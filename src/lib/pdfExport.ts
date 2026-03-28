import jsPDF from 'jspdf';

interface CanvasPdfOptions {
  imageFormat?: 'PNG' | 'JPEG';
  marginMm?: number;
  orientation?: 'portrait' | 'landscape' | 'auto';
}

export async function waitForPrintableRender(delayMs = 80): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    // ignore font readiness failures
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export function canvasToPdfBlob(canvas: HTMLCanvasElement, options: CanvasPdfOptions = {}): Blob {
  const { imageFormat = 'PNG', marginMm = 8, orientation = 'auto' } = options;
  const resolvedOrientation = orientation === 'auto'
    ? canvas.width >= canvas.height
      ? 'landscape'
      : 'portrait'
    : orientation;

  const pdf = new jsPDF({ format: 'a4', orientation: resolvedOrientation, unit: 'mm' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;
  const sourceSliceHeight = Math.max(1, Math.floor((contentHeight * canvas.width) / contentWidth));

  let renderedSourceY = 0;
  let pageIndex = 0;

  while (renderedSourceY < canvas.height) {
    const currentSliceHeight = Math.min(sourceSliceHeight, canvas.height - renderedSourceY);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = currentSliceHeight;

    const sliceContext = sliceCanvas.getContext('2d');
    if (!sliceContext) {
      throw new Error('Failed to create PDF slice canvas');
    }

    sliceContext.drawImage(
      canvas,
      0,
      renderedSourceY,
      canvas.width,
      currentSliceHeight,
      0,
      0,
      canvas.width,
      currentSliceHeight,
    );

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const drawnHeight = (currentSliceHeight * contentWidth) / canvas.width;
    const imageData = imageFormat === 'JPEG'
      ? sliceCanvas.toDataURL('image/jpeg', 0.95)
      : sliceCanvas.toDataURL('image/png');

    pdf.addImage(imageData, imageFormat, marginMm, marginMm, contentWidth, drawnHeight);

    renderedSourceY += currentSliceHeight;
    pageIndex += 1;
  }

  return pdf.output('blob');
}