import { Component, Inject } from '@angular/core';

import { Observable } from 'rxjs';
import { find } from 'rxjs/operators';

import { ViewMode } from '../../../../core/shared/view-mode.model';
import { renderElementsFor } from '../../../object-collection/shared/dso-element-decorator';
import { RemoteData } from '../../../../core/data/remote-data';
import { isNotUndefined } from '../../../empty.util';
import { ListableObject } from '../../../object-collection/shared/listable-object.model';
import { Workflowitem } from '../../../../core/submission/models/workflowitem.model';
import { PoolTask } from '../../../../core/tasks/models/pool-task-object.model';
import { PoolTaskMyDSpaceResult } from '../../../object-collection/shared/pool-task-my-dspace-result.model';
import { MyDSpaceResultDetailElementComponent } from '../my-dspace-result-detail-element.component';
import { MyDspaceItemStatusType } from '../../../object-collection/shared/mydspace-item-status/my-dspace-item-status-type';

@Component({
  selector: 'ds-pooltask-my-dspace-result-detail-element',
  styleUrls: ['../my-dspace-result-detail-element.component.scss'],
  templateUrl: './pt-my-dspace-result-detail-element.component.html',
})

@renderElementsFor(PoolTaskMyDSpaceResult, ViewMode.Detail)
@renderElementsFor(PoolTask, ViewMode.Detail)
export class PoolTaskMyDSpaceResultDetailElementComponent extends MyDSpaceResultDetailElementComponent<PoolTaskMyDSpaceResult, PoolTask> {
  public status = MyDspaceItemStatusType.WAITING_CONTROLLER;
  public workFlow: Workflowitem;

  constructor(@Inject('objectElementProvider') public listable: ListableObject) {

    super(listable);
  }

  ngOnInit() {
    this.initWorkflowItem(this.dso.workflowitem as Observable<RemoteData<Workflowitem>>);
  }

  initWorkflowItem(wfi$: Observable<RemoteData<Workflowitem>>) {
    wfi$.pipe(
      find((rd: RemoteData<Workflowitem>) => (rd.hasSucceeded && isNotUndefined(rd.payload)))
    ).subscribe((rd: RemoteData<Workflowitem>) => {
      this.workFlow = rd.payload;
    });
  }

}