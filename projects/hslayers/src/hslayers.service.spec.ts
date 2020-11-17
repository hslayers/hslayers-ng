import { TestBed } from '@angular/core/testing';

import { HslayersService } from './hslayers.service';

describe('HslayersService', () => {
  let service: HslayersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HslayersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
