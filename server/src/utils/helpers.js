// Utility helpers
export function formatDate(date) {
  return new Date(date).toISOString();
}

export function generateCardLabel(sequence) {
  return 'NFC-' + String(sequence).padStart(3, '0');
}
