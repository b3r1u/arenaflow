import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, filter, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Só injeta token em chamadas para nossa API
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);

  // Aguarda o Firebase terminar de inicializar antes de enviar a requisição
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),   // espera loading = false
    take(1),
    switchMap(() => {
      const user = auth.user();
      if (!user) return next(req); // não autenticado — deixa passar (API retornará 401)

      return from(user.getIdToken()).pipe(
        switchMap(token => {
          const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next(authReq);
        })
      );
    })
  );
};
