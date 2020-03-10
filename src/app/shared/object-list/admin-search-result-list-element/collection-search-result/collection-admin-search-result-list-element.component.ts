import { Component } from '@angular/core';
import { ViewMode } from '../../../../core/shared/view-mode.model';
import { listableObjectComponent } from '../../../object-collection/shared/listable-object/listable-object.decorator';
import { Context } from '../../../../core/shared/context.model';
import { SearchResultListElementComponent } from '../../search-result-list-element/search-result-list-element.component';
import { CollectionSearchResult } from '../../../object-collection/shared/collection-search-result.model';
import { Collection } from '../../../../core/shared/collection.model';
import { getCollectionEditPath } from '../../../../+collection-page/collection-page-routing.module';

@listableObjectComponent(CollectionSearchResult, ViewMode.ListElement, Context.AdminSearch)
@Component({
  selector: 'ds-collection-admin-search-result-list-element',
  styleUrls: ['./collection-admin-search-result-list-element.component.scss'],
  templateUrl: './collection-admin-search-result-list-element.component.html'
})
/**
 * The component for displaying a list element for a collection search result on the admin search page
 */
export class CollectionAdminSearchResultListElementComponent extends SearchResultListElementComponent<CollectionSearchResult, Collection> {
  editPath: string;

  ngOnInit() {
    super.ngOnInit();
    this.editPath = getCollectionEditPath(this.dso.uuid);
  }
}
