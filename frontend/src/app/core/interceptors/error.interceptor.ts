import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado de comunicação.';
      
      if (error.error instanceof ErrorEvent) {
        // Erro do lado do cliente ou rede
        errorMessage = `Erro de conexão: ${error.error.message}`;
      } else {
        // O backend retornou uma resposta de falha
        errorMessage = error.error?.detail || error.message || errorMessage;
      }

      // Exibe toast de erro
      toastService.error(errorMessage);
      
      return throwError(() => error);
    })
  );
};
