import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, Observable, tap, throwError } from "rxjs";
import { StyleTemplateDTO } from "../models/style-template.DTO";

@Injectable({
     providedIn: 'root'
})
export class StyleTemplateService {
     private baseUrl = environment.apiUrl;
     private apiPath = '/styles';
     private styles: StyleTemplateDTO[] = [];

     constructor(private http: HttpClient) { }

     private getAuthHeaders(): HttpHeaders {
          const token = localStorage.getItem('jwt_token');
          let headers = new HttpHeaders();
          if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        }
    
       findAll(): Observable<StyleTemplateDTO[]> {
         const url = `${this.baseUrl}${this.apiPath}`;
         return this.http.get<StyleTemplateDTO[]>(url, { headers: this.getAuthHeaders() }).pipe(
           catchError(err => {
             return throwError(() => err);
           })
         );
       }

        create(style: StyleTemplateDTO): Observable<StyleTemplateDTO> {
           const url = `${this.baseUrl}${this.apiPath}`;
           return this.http.post<StyleTemplateDTO>(url, style, { headers: this.getAuthHeaders() }).pipe(
             catchError(err => {
               return throwError(() => err);
             })
           );
         }

           updateFactor(style: StyleTemplateDTO): Observable<StyleTemplateDTO> {
             const url = `${this.baseUrl}${this.apiPath}/${style.id}`;
             const payload = JSON.stringify(style, null, 2);
             return this.http.put<StyleTemplateDTO>(url, style, { headers: this.getAuthHeaders() }).pipe(
               catchError(err => {
                 return throwError(() => err);
               })
             );
           }

           remove(id: number): Observable<void> {
               const url = `${this.baseUrl}${this.apiPath}/${id}`;
               return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(                 
                 catchError(err => {
                   return throwError(() => err);
                 })
               );
             }
 
}