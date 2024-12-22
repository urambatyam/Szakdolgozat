import { TestBed } from '@angular/core/testing';

import { ElectronicControllerService } from './electronic-controller.service';

describe('ElectronicControllerService', () => {
  let service: ElectronicControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectronicControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
