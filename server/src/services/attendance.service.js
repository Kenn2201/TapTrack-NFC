// Shared attendance service — the architectural centerpiece
// All NFC handlers (Web NFC, URL NFC, Manual) converge here
export const attendanceService = {
  async recordAttendance({ eventId, userId, operatorId, method, cardId }) {
    // Will be implemented in v0.6.0
    // 1. Authenticate operator
    // 2. Validate event + active session
    // 3. Validate user + card (if NFC)
    // 4. Check card status
    // 5. Check duplicate attendance
    // 6. Check attendance window
    // 7. INSERT attendance
    // 8. Update card.last_used_at
    // 9. Write audit log
    // 10. Return success
  },
};

