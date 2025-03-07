import { TestBed } from '@angular/core/testing';

import { SubjectMatterService } from './subject-matter.service';

describe('SubjectMatterService', () => {
  let service: SubjectMatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubjectMatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
