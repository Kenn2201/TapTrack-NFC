// Authentication hook — session and JWT management
// Implementation planned for v0.2.0 ALPHA
import { useState } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  return { user, loading, setUser };
}
