'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentRole, NormalizedRole } from '@/lib/permissions';

/**
 * Client-side route guard.
 *
 * Call this hook at the top of any page component that should only be
 * accessible to specific roles.  If the current user's role is NOT in the
 * `allowed` list, they are immediately redirected to /dashboard.
 *
 * Usage:
 *   useRoleGuard(['ADMIN'])
 *   useRoleGuard(['ADMIN', 'INVENTORY_OFFICER'])
 */
export function useRoleGuard(allowed: NormalizedRole[]) {
  const router = useRouter();

  useEffect(() => {
    const role = getCurrentRole();

    if (!allowed.includes(role)) {
      router.replace('/dashboard');
    }
  }, []);
}
