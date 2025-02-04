import { TestBed } from '@angular/core/testing';

import { CourseForumService } from './course-forum.service';

describe('CourseForumService', () => {
  let service: CourseForumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseForumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
