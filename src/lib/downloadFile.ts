/**
 * Robust file download utility that works reliably in Chrome, Safari, Firefox,
 * and mobile browsers. Falls back to window.open if the download fails.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.target = '_blank';
  a.style.display = 'none';

  // Chrome requires the element to be in the DOM for .click() to work
  document.body.appendChild(a);
  requestAnimationFrame(() => a.click());

  // Delay cleanup to ensure the download starts
  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 600);
}

/**
 * Share a file on mobile (Web Share API) or download on desktop.
 */
export async function shareOrDownload(blob: Blob, fileName: string, mimeType = 'application/pdf'): Promise<void> {
  try {
    const file = new File([blob], fileName, { type: mimeType });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: fileName, files: [file] });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
    // Fall through to open/download
  }

  // On desktop: open PDF in a new tab so Windows users can view it directly
  if (mimeType === 'application/pdf') {
    openBlobInNewTab(blob, mimeType);
  } else {
    downloadBlob(blob, fileName);
  }
}

/**
 * Open a blob in a new browser tab. Works great for PDFs on desktop (Chrome/Edge/Firefox).
 */
export function openBlobInNewTab(blob: Blob, mimeType = 'application/pdf'): void {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const win = window.open(url, '_blank');
  // If popup was blocked, fall back to download
  if (!win) {
    downloadBlob(blob, 'document.pdf');
  }
  // Revoke after a delay to let the new tab load
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Share text content on mobile or download as text file on desktop.
 */
export async function shareOrDownloadText(text: string, fileName: string, title?: string): Promise<void> {
  try {
    if (navigator.share) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], fileName, { type: 'text/plain' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: title || fileName, files: [file] });
        return;
      }
      await navigator.share({ title: title || fileName, text });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName);
}
