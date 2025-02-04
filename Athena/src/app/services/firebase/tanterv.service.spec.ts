import { TestBed } from '@angular/core/testing';

import { TantervService } from './tanterv.service';

describe('TantervService', () => {
  let service: TantervService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TantervService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
