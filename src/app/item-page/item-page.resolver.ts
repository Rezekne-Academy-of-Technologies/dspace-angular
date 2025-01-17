import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { RemoteData } from '../core/data/remote-data';
import { ItemDataService } from '../core/data/item-data.service';
import { Item } from '../core/shared/item.model';
import { Store } from '@ngrx/store';
import { map, isEmpty } from 'rxjs/operators';
import { hasValue, isNotEmpty } from '../shared/empty.util';
import { getItemPageRoute } from './item-page-routing-paths';
import { ItemResolver } from './item.resolver';

/**
 * This class represents a resolver that requests a specific item before the route is activated and will redirect to the
 * entity page
 */
@Injectable()
export class ItemPageResolver extends ItemResolver {
  constructor(
    protected itemService: ItemDataService,
    protected store: Store<any>,
    protected router: Router
  ) {
    super(itemService, store, router);
  }

  /**
   * Method for resolving an item based on the parameters in the current route
   * @param {ActivatedRouteSnapshot} route The current ActivatedRouteSnapshot
   * @param {RouterStateSnapshot} state The current RouterStateSnapshot
   * @returns Observable<<RemoteData<Item>> Emits the found item based on the parameters in the current route,
   * or an error if something went wrong
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<RemoteData<Item>> {
    return super.resolve(route, state).pipe(
      map((rd: RemoteData<Item>) => {
        if (rd.hasSucceeded && hasValue(rd.payload)) {
          const itemRoute = getItemPageRoute(rd.payload);
          // Check if custom url not empty and if the current id parameter is different from the custom url redirect to custom url
          if (hasValue(rd.payload.metadata) && isNotEmpty(rd.payload.metadata['cris.customurl'])) {
            if (route.params.id !== rd.payload.metadata['cris.customurl'][0].value) {
              this.router.navigateByUrl(getItemPageRoute(rd.payload));
            }
          } else {
            const thisRoute = state.url;
            if (!thisRoute.startsWith(itemRoute)) {
              const itemId = rd.payload.uuid;
              const subRoute = thisRoute.substring(thisRoute.indexOf(itemId) + itemId.length, thisRoute.length);
              this.router.navigateByUrl(itemRoute + subRoute);
            }
          }
        }
        return rd;
      })
    );
  }
}
