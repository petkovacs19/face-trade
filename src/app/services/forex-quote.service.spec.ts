import { TestBed } from '@angular/core/testing';

import { ForexQuoteService } from './forex-quote.service';

describe('ForexQuoteServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ForexQuoteService = TestBed.get(ForexQuoteService);
    expect(service).toBeTruthy();
  });
});
