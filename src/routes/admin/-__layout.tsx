import { Outlet } from '@tanstack/react-router';

export default function AdminLayout() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <nav className='bg-primary text-white p-4 shadow-md'>
        <h1 className='text-2xl font-bold'>Admin Panel</h1>
      </nav>
      <main className='p-6'>
        <Outlet />
      </main>
    </div>
  );
}
