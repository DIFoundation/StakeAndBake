'use client';

import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

  if (!isConnected) return null;

  return <>{children}</>;
}
