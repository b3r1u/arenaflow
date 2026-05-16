import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PLATFORM_ADMIN_EMAIL = 'connectsolve.ti@gmail.com';

export const platformAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Aguarda o Firebase terminar de inicializar antes de decidir
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      const user = auth.user();
      if (user?.email === PLATFORM_ADMIN_EMAIL) return true;
      router.navigate(['/']);
      return false;
    }),
  );
};
