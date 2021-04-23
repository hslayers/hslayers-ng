import { TestBed } from '@angular/core/testing';

import { HslayersMaterialService } from './hslayers-material.service';

describe('HslayersMaterialService', () => {
  let service: HslayersMaterialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HslayersMaterialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
