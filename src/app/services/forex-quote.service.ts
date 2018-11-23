import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForexQuoteService {

  pairs = ['GBPUSD']
  API_URL = 'https://forex.1forge.com/1.0.3/quotes'
  API_KEY = 'INSERT_YOUR_API_KEY_HERE'

  constructor(private httpClient: HttpClient) {
    if(this.API_KEY === 'INSERT_YOUR_API_KEY_HERE'){
        console.error('UPDATE YOUR API KEY');
    }
  }


  public getForexQuote(pairs: Array<String>): Observable<JSON> {
    const forexQuoteUrl = `${this.API_URL}?pairs=${pairs}&api_key=${this.API_KEY}`
    return this.httpClient.get<JSON>(forexQuoteUrl).pipe(
      tap(_ => console.log(`fetched forex quotes for ${pairs}`)),
      catchError(this.handleError<any>(`get quotes pais=${pairs}`))
    );

  }


  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


}
