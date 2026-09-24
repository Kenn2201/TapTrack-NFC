import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminWorkspaceNav from './AdminWorkspaceNav';

export default function AdminShell() {
  return (
    <section className="min-w-0" aria-label="Administration">
      <AdminWorkspaceNav />
      <Outlet />
    </section>
  );
}
