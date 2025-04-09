import { TestBed } from '@angular/core/testing';

import { OptimalizationService } from './optimalization.service';

describe('OptimalizationService', () => {
  let service: OptimalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptimalizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
