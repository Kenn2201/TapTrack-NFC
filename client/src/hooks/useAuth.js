// Authentication hook — session and JWT management
import { useState } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth logic will be implemented in v0.2.0
  return { user, loading, setUser };
}
