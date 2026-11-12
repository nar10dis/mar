import { Outlet } from 'react-router';
import { StatusBar } from './StatusBar.tsx';

export function RootLayout() {
  return (
    <>
      <StatusBar />
      <Outlet />
    </>
  );
}
