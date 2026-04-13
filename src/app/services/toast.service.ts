import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messageSubject = new BehaviorSubject<ToastMessage | null>(null);
  message$ = this.messageSubject.asObservable();

  show(msg: string, type: 'success' | 'error' = 'success', duration = 4000) {
    this.messageSubject.next({ text: msg, type });
    setTimeout(() => this.messageSubject.next(null), duration);
  }
}
