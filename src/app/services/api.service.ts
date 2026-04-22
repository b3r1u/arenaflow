import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Token para marcar requisições silenciosas — ignora o loading global */
export const SILENT_REQUEST = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = environment.apiUrl;

  constructor(public http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  /** Requisição GET que não dispara o loading global (ex: polling silencioso) */
  getSilent<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      params:  httpParams,
      context: new HttpContext().set(SILENT_REQUEST, true),
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
