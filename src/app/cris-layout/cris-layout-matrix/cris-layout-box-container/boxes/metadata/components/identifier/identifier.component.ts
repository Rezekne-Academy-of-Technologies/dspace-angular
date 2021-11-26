import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FieldRenderingType, MetadataBoxFieldRendering } from '../metadata-box.decorator';
import { ResolverStrategyService } from '../../../../../../services/resolver-strategy.service';
import { hasValue } from '../../../../../../../shared/empty.util';
import { MetadataLinkValue } from '../../../../../../models/cris-layout-metadata-link-value.model';
import { RenderingTypeValueModelComponent } from '../rendering-type-value.model';
import { LayoutField } from '../../../../../../../core/layout/models/metadata-component.model';
import { Item } from '../../../../../../../core/shared/item.model';

/**
 * This component renders the identifier metadata fields.
 */
@Component({
  selector: 'ds-identifier',
  templateUrl: './identifier.component.html',
  styleUrls: ['./identifier.component.scss']
})
@MetadataBoxFieldRendering(FieldRenderingType.IDENTIFIER)
export class IdentifierComponent extends RenderingTypeValueModelComponent implements OnInit {

  /**
   * The identifier to render
   */
  identifier: MetadataLinkValue;
  /**
   * value of href anchor
   */
  href: string[];
  /**
   * text to show in the anchor
   */
  text: string[];
  /**
   * specifies where to open the linked document
   */
  target = '_blank';

  constructor(
    @Inject('fieldProvider') public fieldProvider: LayoutField,
    @Inject('itemProvider') public itemProvider: Item,
    @Optional() @Inject('metadataValueProvider') public metadataValueProvider: any,
    @Inject('renderingSubTypeProvider') public renderingSubTypeProvider: string,
    private resolver: ResolverStrategyService
  ) {
    super(fieldProvider, itemProvider, metadataValueProvider, renderingSubTypeProvider);
  }

  getIdentifierFromValue() {
    let identifier: MetadataLinkValue;
    if (hasValue(this.renderingSubType)) {
      identifier = this.composeLink(this.metadataValue, this.renderingSubType);
    } else {
      // Check if the value is a link (http, https, ftp or ftps)
      // otherwise resolve link with managed urn
      if (this.resolver.checkLink(this.metadataValue)) {
        identifier = {
          href: this.metadataValue,
          text: this.metadataValue
        };
      } else {
        for (const urn of this.resolver.managedUrn) {
          if (hasValue(this.metadataValue) && this.metadataValue.toLowerCase().startsWith(urn)) {
            identifier = this.composeLink(this.metadataValue, urn);
            break;
          }
        }
      }
    }
    return identifier;
  }

  /**
   * Set href and text of the component based on urn
   * and the given metadata value
   * @param metadataValue the metadata value
   * @param urn URN type (doi, hdl, mailto)
   */
  composeLink(metadataValue: string, urn: string): MetadataLinkValue {
    let value = metadataValue;
    const rep = urn + ':';
    if (metadataValue.startsWith(rep)) {
      value = metadataValue.replace(rep, '');
    }
    const href = this.resolver.getBaseUrl(urn) + value;
    const text = hasValue(value) && value !== '' ? value : href;
    return {
      href,
      text
    };
  }

  ngOnInit(): void {
    this.identifier = this.getIdentifierFromValue();
  }
}
