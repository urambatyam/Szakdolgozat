import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StatisticsComponent } from './statistics.component';
import { StatisticsService } from '../../services/mysql/statistics.service';
import { of, throwError, Subject, Observable } from 'rxjs'; 
import { TranslateService } from '@ngx-translate/core';
import { EventEmitter, ElementRef, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min'; 
//import 'jasmine';
import { createT } from './charts/tan';
import { createLR } from './charts/linearRegression';
import { createAT } from './charts/allTan';
const createTMock = jasmine.createSpy('createT');
const createLRMock = jasmine.createSpy('createLR');
const createATMock = jasmine.createSpy('createAT');

const StatisticsServiceMock = {
  studentTAN: jasmine.createSpy('studentTAN').and.returnValue(of({ data: [1], label: ['2023 1'] })), 
  studentLinearisRegression: jasmine.createSpy('studentLinearisRegression').and.returnValue(of({ m: 1, b: 1, pairs: [[1, 2]], label: ['2023 1'] })),
  allTAN: jasmine.createSpy('allTAN').and.returnValue(of({ data: [1], label: ['2023 1'] })),
  progres: jasmine.createSpy('progres').and.returnValue(of({ curriculum_name: 'Test', specializations: [] }))
};

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    instant: jasmine.createSpy('instant').and.returnValue('mock-instant'),
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};



describe('StatisticsComponent', () => {
  let component: StatisticsComponent;
  let fixture: ComponentFixture<StatisticsComponent>;
  let statisticsService: StatisticsService;
  let cdr: ChangeDetectorRef;
  let ngZone: NgZone;
  let plotlyPurgeSpy: jasmine.Spy;
  let plotlyResizeSpy: jasmine.Spy;

  const createMockElementRef = (): ElementRef<HTMLDivElement> => {
    const mockDiv = document.createElement('div');
    return new ElementRef<HTMLDivElement>(mockDiv);
  };

  beforeEach(fakeAsync(() => { 
    plotlyPurgeSpy = spyOn(Plotly, 'purge').and.callThrough();
    plotlyResizeSpy = spyOn(Plotly.Plots, 'resize').and.callThrough();
    StatisticsServiceMock.studentTAN.calls.reset();
    StatisticsServiceMock.studentLinearisRegression.calls.reset();
    StatisticsServiceMock.allTAN.calls.reset();
    StatisticsServiceMock.progres.calls.reset();
    createTMock.calls.reset();
    createLRMock.calls.reset();
    createATMock.calls.reset();
    plotlyPurgeSpy.calls.reset();
    plotlyResizeSpy.calls.reset();

    TestBed.configureTestingModule({
      imports: [StatisticsComponent, BrowserAnimationsModule], 
      providers: [
        { provide: StatisticsService, useValue: StatisticsServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;
    statisticsService = TestBed.inject(StatisticsService); 
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef); 
    ngZone = TestBed.inject(NgZone); 
    component.chartContainer = createMockElementRef();

    fixture.detectChanges(); 
    flush();
  }));

  it('should create StatisticsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with Progress view', () => {
    expect(component.statisctics).toBe('p'); 
    expect(component['title']).toBe('statistics.PROGRESS');
    expect(StatisticsServiceMock.progres).toHaveBeenCalled();
  });

  describe('ngAfterViewInit', () => {
    it('should call renderCurrentChart and setupResizeListener', () => {
      spyOn(component, 'renderCurrentChart');
      spyOn(component, 'setupResizeListener');
      component.ngAfterViewInit();
      expect(component.renderCurrentChart).toHaveBeenCalled();
      expect(component.setupResizeListener).toHaveBeenCalled();
    });
  });

  describe('renderCurrentChart', () => {
    it('should call fetchAndSetProgress and set title for Progress view', () => {
      spyOn(component as any, 'fetchAndSetProgress');
      component.statisctics = 'p' as any; 
      component.renderCurrentChart();
      expect(component['title']).toBe('statistics.PROGRESS');
      expect((component as any).fetchAndSetProgress).toHaveBeenCalled();
      expect(plotlyPurgeSpy).not.toHaveBeenCalled(); 
    });

    it('should log error and set title if chart container not found after timeout', fakeAsync(() => {
        spyOn(console, 'error');
        component.chartContainer = undefined as any; 
        component['_statistics'] = 'p' as any;
        component.statisctics = 't' as any; 
        tick(0); 
        expect(console.error).toHaveBeenCalledWith('Chart container STILL not found after timeout!');
        expect(component['title']).toBe('Hiba'); 
    }));
  });

  describe('fetchAndRenderChart', () => {
    const mockCreateFn = jasmine.createSpy('mockCreateFn');
     it('should return early if chart container is not found', fakeAsync(() => {
      const mockObservable = of({});
      const titleKey = 'test.TITLE_NOCONTAINER';
      component.chartContainer = undefined as any; 
      spyOn(console, 'error');

      (component as any).fetchAndRenderChart(mockObservable, mockCreateFn, titleKey);
      flush(); 

      expect(component['title']).toBe(titleKey); 
      expect(console.error).toHaveBeenCalledWith(`Chart container not found when trying to render ${titleKey}`);
      expect(mockCreateFn).not.toHaveBeenCalled();
    }));
  });

  describe('fetchAndSetProgress', () => {
    it('should call service and set progressData on success', fakeAsync(() => {
      const mockProgress = { curriculum_name: 'Test', specializations: [{ name: 'Spec1' }] };
      StatisticsServiceMock.progres.and.returnValue(of(mockProgress));
      (component as any).fetchAndSetProgress();
      flush(); 
      expect(StatisticsServiceMock.progres).toHaveBeenCalled();
      expect(component['progressData']).toEqual(mockProgress as any); 
    }));

    it('should call service, log error, and set progressData to null on error', fakeAsync(() => {
      const mockError = new Error('Progress Failed');
      StatisticsServiceMock.progres.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');
      (component as any).fetchAndSetProgress();
      flush(); 
      expect(StatisticsServiceMock.progres).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Progress Hiba: ', mockError);
      expect(component['progressData']).toBeNull();
    }));
  });

  describe('Navigation', () => {
    it('should navigate next from Progress to TAN', () => {
      component['_statistics'] = 'p' as any;
      component.navigateNext();
      expect(component.statisctics).toBe('t');
    });

    it('should navigate next from AllTan to Progress (wrap around)', () => {
      component['_statistics'] = 'at' as any;
      component.navigateNext();
      expect(component.statisctics).toBe('p');
    });

    it('should navigate previous from TAN to Progress', () => {
      component['_statistics'] = 't' as any;
      component.navigatePrevious();
      expect(component.statisctics).toBe('p');
    });

    it('should navigate previous from Progress to AllTan (wrap around)', () => {
      component['_statistics'] = 'p' as any;
      component.navigatePrevious();
      expect(component.statisctics).toBe('at');
    });

    it('should call renderCurrentChart when statistics type changes via navigation', () => {
        spyOn(component, 'renderCurrentChart');
        component['_statistics'] = 'p' as any;
        component.navigateNext(); 
        expect(component.renderCurrentChart).toHaveBeenCalled();
    });
  });

  describe('Resize Handling', () => {


    it('should NOT call Plotly.Plots.resize on window resize if Progress view is shown', fakeAsync(() => {
        component.statisctics = 'p' as any; 
        tick(0);
        flush();
        plotlyResizeSpy.calls.reset();
        window.dispatchEvent(new Event('resize'));
        tick(300); 
        expect(plotlyResizeSpy).not.toHaveBeenCalled();
    }));
  });

   describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySubject = (component as any).destroy$ as Subject<void>;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');
      component.ngOnDestroy();
      expect(destroySubject.next).toHaveBeenCalledTimes(1);
      expect(destroySubject.complete).toHaveBeenCalledTimes(1);
    });
  });
});