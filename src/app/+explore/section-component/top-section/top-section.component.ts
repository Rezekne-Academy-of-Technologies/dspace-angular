import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getItemPageRoute } from 'src/app/+item-page/item-page-routing.module';
import { SortDirection, SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { TopSection } from 'src/app/core/layout/models/section.model';
import { DSpaceObject } from 'src/app/core/shared/dspace-object.model';
import { SearchService } from 'src/app/core/shared/search/search.service';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from 'src/app/shared/search/paginated-search-options.model';
import { getFirstSucceededRemoteDataPayload } from '../../../core/shared/operators';
import { SearchObjects } from '../../../shared/search/search-objects.model';
import { SearchResult } from '../../../shared/search/search-result.model';

/**
 * Component representing the Top component section.
 */
@Component({
  selector: 'ds-top-section',
  templateUrl: './top-section.component.html'
})
export class TopSectionComponent implements OnInit {

  @Input()
  sectionId: string;

  @Input()
  topSection: TopSection;

  topObjects: Observable<DSpaceObject[]>;

  constructor(private searchService: SearchService) {

  }

  ngOnInit() {

    const order = this.topSection.order;
    const sortDirection = order && order.toUpperCase() === 'ASC' ? SortDirection.ASC : SortDirection.DESC;
    const pagination: PaginationComponentOptions = Object.assign(new PaginationComponentOptions(), {
      id: 'search-object-pagination',
      pageSize: 5,
      currentPage: 1
    });

    this.topObjects = this.searchService.searchEntries(new PaginatedSearchOptions({
      configuration: this.topSection.discoveryConfigurationName,
      pagination: pagination,
      sort: new SortOptions(this.topSection.sortField, sortDirection)
    })).pipe(
      getFirstSucceededRemoteDataPayload(),
      map((response: SearchObjects<DSpaceObject>) => response.page
        .map((searchResult: SearchResult<DSpaceObject>) => searchResult._embedded.indexableObject)
      )
    );
  }

  /**
   * Get the item page url
   * @param id The item id for which the url is requested
   */
  getItemPage(id: string): string {
    return getItemPageRoute(id);
  }
}