import { TestBed } from '@angular/core/testing';

import { CurriculumsService } from './curriculums.service';

describe('CurriculumsService', () => {
  let service: CurriculumsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurriculumsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
