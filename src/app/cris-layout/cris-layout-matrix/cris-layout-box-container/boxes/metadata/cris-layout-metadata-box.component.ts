import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import { CrisLayoutBoxModelComponent } from '../../../../models/cris-layout-box-component.model';
import { CrisLayoutBox } from '../../../../decorators/cris-layout-box.decorator';
import { LayoutBox } from '../../../../enums/layout-box.enum';
import { MetadataComponentsDataService } from '../../../../../core/layout/metadata-components-data.service';
import { Subscription } from 'rxjs';
import { hasValue } from '../../../../../shared/empty.util';
import { TranslateService } from '@ngx-translate/core';
import { Box, MetadataBoxConfiguration } from '../../../../../core/layout/models/box.model';
import { Item } from '../../../../../core/shared/item.model';

/**
 * This component renders the metadata boxes of items
 */
@Component({
  selector: 'ds-cris-layout-metadata-box',
  templateUrl: './cris-layout-metadata-box.component.html',
  styleUrls: ['./cris-layout-metadata-box.component.scss']
})
/**
 * For overwrite this component create a new one that extends CrisLayoutBoxObj and
 * add the CrisLayoutBoxModelComponent decorator indicating the type of box to overwrite
 */
@CrisLayoutBox(LayoutBox.METADATA)
export class CrisLayoutMetadataBoxComponent extends CrisLayoutBoxModelComponent implements OnInit, OnDestroy {

  /**
   * Contains the fields configuration for current box
   */
  metadatacomponents: MetadataComponent;

  /**
   * true if the item has a thumbanil, false otherwise
   */
  hasThumbnail = false;

  /**
   * List of subscriptions
   */
  subs: Subscription[] = [];

  constructor(
    public cd: ChangeDetectorRef,
    protected metadatacomponentsService: MetadataComponentsDataService,
    protected translateService: TranslateService,
    protected viewRef: ElementRef,
    @Inject('boxProvider') public boxProvider: Box,
    @Inject('itemProvider') public itemProvider: Item
  ) {
    super(translateService, viewRef, boxProvider, itemProvider);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.push(this.metadatacomponentsService.findById(this.box.id)
      .pipe(getAllSucceededRemoteDataPayload())
      .subscribe(
        (next) => {
          this.setMetadataComponents(next);
          this.cd.markForCheck();
        }
      ));

  }

  /**
   * Set the metadatacomponents.
   * @param metadatacomponents
   */
  setMetadataComponents(metadatacomponents: MetadataComponent) {
    this.metadatacomponents = metadatacomponents;
  }

  /**
   * Unsubscribes all subscriptions
   */
  ngOnDestroy(): void {
    this.subs.filter((sub) => hasValue(sub)).forEach((sub) => sub.unsubscribe());
  }
}
