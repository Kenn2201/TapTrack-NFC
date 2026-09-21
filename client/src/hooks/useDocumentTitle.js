import { useEffect } from 'react';

const BRAND = 'TapTrack-NFC';

/**
 * Sets the browser tab title for the current page.
 * @param {string} [pageTitle] - Page-specific title (e.g. "Dashboard").
 *   If provided, the tab shows "Dashboard | TapTrack-NFC".
 *   If omitted, the tab shows "TapTrack-NFC".
 */
export default function useDocumentTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${BRAND}` : BRAND;
    return () => { document.title = BRAND; };
  }, [pageTitle]);
}
