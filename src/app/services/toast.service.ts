import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messageSubject = new BehaviorSubject<string | null>(null);
  message$ = this.messageSubject.asObservable();

  show(msg: string, duration = 3000) {
    this.messageSubject.next(msg);
    setTimeout(() => this.messageSubject.next(null), duration);
  }
}
