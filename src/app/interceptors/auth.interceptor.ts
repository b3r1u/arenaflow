import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Só injeta token em chamadas para nossa API
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const user = auth.user();

  if (!user) return next(req);

  return from(user.getIdToken()).pipe(
    switchMap(token => {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authReq);
    })
  );
};
