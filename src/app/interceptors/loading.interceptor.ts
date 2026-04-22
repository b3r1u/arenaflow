import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { SILENT_REQUEST } from '../services/api.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Requisições silenciosas (ex: polling de status) não ativam o loading global
  if (req.context.get(SILENT_REQUEST)) return next(req);

  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(finalize(() => loading.hide()));
};
