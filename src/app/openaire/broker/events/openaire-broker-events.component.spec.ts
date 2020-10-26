import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of as observableOf } from 'rxjs';
import { OpenaireBrokerEventRestService } from '../../../core/openaire/broker/events/openaire-broker-event-rest.service';
import { OpenaireBrokerEventsComponent } from './openaire-broker-events.component';
import {
  getMockOpenaireBrokerEventRestService,
  ItemMockPid10,
  openaireBrokerEventObjectMissingProjectFound,
  openaireBrokerEventObjectMissingProjectNotFound,
  OpenaireMockDspaceObject
} from '../../../shared/mocks/openaire.mock';
import { NotificationsServiceStub } from '../../../shared/testing/notifications-service.stub';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { getMockTranslateService } from '../../../shared/mocks/translate.service.mock';
import { createTestComponent } from '../../../shared/testing/utils.test';
import { ActivatedRouteStub } from '../../../shared/testing/active-router.stub';
import { PaginationComponentOptions } from '../../../shared/pagination/pagination-component-options.model';
import { OpenaireBrokerEventObject } from '../../../core/openaire/broker/models/openaire-broker-event.model';
import { OpenaireBrokerEventData } from '../project-entry-import-modal/project-entry-import-modal.component';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'jasmine-marbles';
import { RestResponse } from '../../../core/cache/response.models';
import { followLink } from '../../../shared/utils/follow-link-config.model';
import { PageInfo } from '../../../core/shared/page-info.model';
import { PaginatedList } from '../../../core/data/paginated-list';
import { createSuccessfulRemoteDataObject } from '../../../shared/remote-data.utils';
import { FindListOptions } from '../../../core/data/request.models';

describe('OpenaireBrokerEventsComponent test suite', () => {
  let fixture: ComponentFixture<OpenaireBrokerEventsComponent>;
  let comp: OpenaireBrokerEventsComponent;
  let compAsAny: any;
  let scheduler: TestScheduler;

  const modalStub = {
      open: () => ( {result: new Promise((res, rej) => 'do')} ),
      close: () => null,
      dismiss: () => null
  };
  const openaireBrokerEventRestServiceStub: any = getMockOpenaireBrokerEventRestService();
  const activatedRouteParams = {
    openaireBrokerEventsParams: {
      currentPage: 0,
      pageSize: 10
    }
  };
  const activatedRouteParamsMap = {
    id: 'ENRICH!MISSING!PROJECT'
  };

  const events: OpenaireBrokerEventObject[] = [
    openaireBrokerEventObjectMissingProjectFound,
    openaireBrokerEventObjectMissingProjectNotFound
  ];

  function getOpenAireBrokerEventData1(): OpenaireBrokerEventData {
    return {
      event: openaireBrokerEventObjectMissingProjectFound,
      id: openaireBrokerEventObjectMissingProjectFound.id,
      title: openaireBrokerEventObjectMissingProjectFound.title,
      hasProject: true,
      projectTitle: openaireBrokerEventObjectMissingProjectFound.message.title,
      projectId: ItemMockPid10.id,
      handle: ItemMockPid10.handle,
      reason: null,
      isRunning: false
    };
  }

  function getOpenAireBrokerEventData2(): OpenaireBrokerEventData {
    return {
      event: openaireBrokerEventObjectMissingProjectNotFound,
      id: openaireBrokerEventObjectMissingProjectNotFound.id,
      title: openaireBrokerEventObjectMissingProjectNotFound.title,
      hasProject: false,
      projectTitle: null,
      projectId: null,
      handle: null,
      reason: null,
      isRunning: false
    };
  }

  beforeEach(async (() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        TranslateModule.forRoot(),
      ],
      declarations: [
        OpenaireBrokerEventsComponent,
        TestComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub(activatedRouteParamsMap, activatedRouteParams) },
        { provide: OpenaireBrokerEventRestService, useValue: openaireBrokerEventRestServiceStub },
        { provide: NgbModal, useValue: modalStub },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: TranslateService, useValue: getMockTranslateService() },
        OpenaireBrokerEventsComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents().then();
    scheduler = getTestScheduler();
  }));

  // First test to check the correct component creation
  describe('', () => {
    let testComp: TestComponent;
    let testFixture: ComponentFixture<TestComponent>;

    // synchronous beforeEach
    beforeEach(() => {
      const html = `
        <ds-openaire-broker-event></ds-openaire-broker-event>`;
      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });

    afterEach(() => {
      testFixture.destroy();
    });

    it('should create OpenaireBrokerEventsComponent', inject([OpenaireBrokerEventsComponent], (app: OpenaireBrokerEventsComponent) => {
      expect(app).toBeDefined();
    }));
  });

  describe('Main tests', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OpenaireBrokerEventsComponent);
      comp = fixture.componentInstance;
      compAsAny = comp;
    });

    afterEach(() => {
      fixture.destroy();
      comp = null;
      compAsAny = null;
    });

    describe('setPage', () => {
      it('should call getOpenaireBrokerEvents', () => {
        spyOn(compAsAny, 'getOpenaireBrokerEvents');
        comp.paginationConfig = new PaginationComponentOptions();
        comp.paginationConfig.currentPage = 1;

        comp.setPage(2);
        expect(compAsAny.getOpenaireBrokerEvents).toHaveBeenCalled();
      });
    });

    describe('setEventUpdated', () => {
      it('should make a BehaviorSubject<OpenaireBrokerEventData[ ... ]>', () => {
        const expected$: BehaviorSubject<OpenaireBrokerEventData[]> = new BehaviorSubject([
          getOpenAireBrokerEventData1(),
          getOpenAireBrokerEventData2()
        ]);
        scheduler.schedule(() => {
          compAsAny.setEventUpdated(events);
        });
        scheduler.flush();

        expect(comp.eventsUpdated$).toEqual(expected$);
      });
    });

    describe('modalChoice', () => {
      beforeEach(() => {
        spyOn(comp, 'executeAction');
        spyOn(comp, 'openModal');
      });

      it('should call executeAction if a project is present', () => {
        const action = 'ACCEPTED';
        comp.modalChoice(action, getOpenAireBrokerEventData1(), modalStub);
        expect(comp.executeAction).toHaveBeenCalledWith(action, getOpenAireBrokerEventData1());
      });

      it('should call openModal if a project is not present', () => {
        const action = 'ACCEPTED';
        comp.modalChoice(action, getOpenAireBrokerEventData2(), modalStub);
        expect(comp.openModal).toHaveBeenCalledWith(action, getOpenAireBrokerEventData2(), modalStub);
      });
    });

    describe('openModal', () => {
      it('should call modalService.open', () => {
        const action = 'ACCEPTED';
        comp.selectedReason = null;
        spyOn(compAsAny.modalService, 'open').and.returnValue({ result: new Promise((res, rej) => 'do' ) });
        spyOn(comp, 'executeAction');

        comp.openModal(action, getOpenAireBrokerEventData1(), modalStub);
        expect(compAsAny.modalService.open).toHaveBeenCalled();
      });
    });

    describe('openModalLookup', () => {
      it('should call modalService.open', () => {
        spyOn(compAsAny.modalService, 'open').and.returnValue(
          {
            componentInstance: {
              externalSourceEntry: null,
              label: null,
              importedObject: observableOf(() => {
                return {
                  indexableObject: OpenaireMockDspaceObject
                };
              })
            }
          }
        );
        scheduler.schedule(() => {
          comp.openModalLookup(getOpenAireBrokerEventData1());
        })
        scheduler.flush();

        expect(compAsAny.modalService.open).toHaveBeenCalled();
      });
    });

    describe('executeAction', () => {
      it('should call getOpenaireBrokerEvents on 200 response from REST', () => {
        const action = 'ACCEPTED';
        spyOn(compAsAny, 'getOpenaireBrokerEvents');
        openaireBrokerEventRestServiceStub.patchEvent.and.returnValue(observableOf(new RestResponse(true, 200, 'Success')));

        scheduler.schedule(() => {
          comp.executeAction(action, getOpenAireBrokerEventData1());
        });
        scheduler.flush();

        expect(compAsAny.getOpenaireBrokerEvents).toHaveBeenCalled();
      });
    });

    describe('boundProject', () => {
      it('should populate the project data inside "eventData", on 201 response from REST', () => {
        const eventData = getOpenAireBrokerEventData2();
        const projectId = 'UUID-23943-34u43-38344';
        const projectName = 'Test Project';
        const projectHandle = '1000/1000';
        openaireBrokerEventRestServiceStub.boundProject.and.returnValue(observableOf(new RestResponse(true, 201, 'Created')));

        scheduler.schedule(() => {
          comp.boundProject(eventData, projectId, projectName, projectHandle);
        });
        scheduler.flush();

        expect(eventData.hasProject).toEqual(true);
        expect(eventData.projectId).toEqual(projectId);
        expect(eventData.projectTitle).toEqual(projectName);
        expect(eventData.handle).toEqual(projectHandle);
      });
    });

    describe('removeProject', () => {
      it('should remove the project data inside "eventData", on 204 response from REST', () => {
        const eventData = getOpenAireBrokerEventData1();
        openaireBrokerEventRestServiceStub.removeProject.and.returnValue(observableOf(new RestResponse(true, 204, 'No Content')));

        scheduler.schedule(() => {
          comp.removeProject(eventData);
        });
        scheduler.flush();

        expect(eventData.hasProject).toEqual(false);
        expect(eventData.projectId).toBeNull();
        expect(eventData.projectTitle).toBeNull();
        expect(eventData.handle).toBeNull();
      });
    });

    describe('getOpenaireBrokerEvents', () => {
      it('should call the "openaireBrokerEventRestService.getEventsByTopic" to take data and "setEventUpdated" to populate eventData', () => {
        comp.paginationConfig = new PaginationComponentOptions();
        comp.paginationConfig.pageSize = 10;
        comp.paginationConfig.currentPage = 1;
        comp.topic = activatedRouteParamsMap.id;
        const options: FindListOptions = {
          elementsPerPage: comp.paginationConfig.pageSize,
          currentPage: comp.paginationConfig.currentPage,
        };

        const pageInfo = new PageInfo({
          elementsPerPage: comp.paginationConfig.pageSize,
          totalElements: 0,
          totalPages: 1,
          currentPage: comp.paginationConfig.currentPage
        });
        const array =  [
          openaireBrokerEventObjectMissingProjectFound,
          openaireBrokerEventObjectMissingProjectNotFound,
        ];
        const paginatedList = new PaginatedList(pageInfo, array);
        const paginatedListRD = createSuccessfulRemoteDataObject(paginatedList);
        openaireBrokerEventRestServiceStub.getEventsByTopic.and.returnValue(observableOf(paginatedListRD));
        spyOn(compAsAny, 'setEventUpdated');

        scheduler.schedule(() => {
          compAsAny.getOpenaireBrokerEvents();
        });
        scheduler.flush();

        expect(compAsAny.openaireBrokerEventRestService.getEventsByTopic).toHaveBeenCalledWith(
          activatedRouteParamsMap.id,
          options,
          followLink('target'),followLink('related')
        );
        expect(compAsAny.setEventUpdated).toHaveBeenCalled();
      });
    });

  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``
})
class TestComponent {

}
