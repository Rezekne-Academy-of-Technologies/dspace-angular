import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, flatMap, map, mergeMap, scan, take } from 'rxjs/operators';
import {
  DynamicFormControlComponent,
  DynamicFormControlModel,
  DynamicFormGroupModel,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicInputModel
} from '@ng-dynamic-forms/core';
import { isEqual, isObject } from 'lodash';

import { DynamicRelationGroupModel } from './dynamic-relation-group.model';
import { FormBuilderService } from '../../../form-builder.service';
import { SubmissionFormsModel } from '../../../../../../core/config/models/config-submission-forms.model';
import { FormService } from '../../../../form.service';
import { FormComponent } from '../../../../form.component';
import { Chips } from '../../../../../chips/models/chips.model';
import { hasValue, isEmpty, isNotEmpty, isNotNull } from '../../../../../empty.util';
import { shrinkInOut } from '../../../../../animations/shrink';
import { ChipsItem } from '../../../../../chips/models/chips-item.model';
import { hasOnlyEmptyProperties } from '../../../../../object.util';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { FormFieldMetadataValueObject } from '../../../models/form-field-metadata-value.model';
import { environment } from '../../../../../../../environments/environment';
import { PLACEHOLDER_PARENT_METADATA } from '../../ds-dynamic-form-constants';
import { getFirstSucceededRemoteDataPayload } from '../../../../../../core/shared/operators';
import { VocabularyEntryDetail } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry-detail.model';
import { DsDynamicInputModel } from '../ds-dynamic-input.model';
import { Vocabulary } from '../../../../../../core/submission/vocabularies/models/vocabulary.model';
import { VocabularyOptions } from '../../../../../../core/submission/vocabularies/models/vocabulary-options.model';
import { VocabularyExternalSourceComponent } from '../../../../../vocabulary-external-source/vocabulary-external-source.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VocabularyEntry } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import { SubmissionScopeType } from '../../../../../../core/submission/submission-scope-type';
import { SubmissionService } from '../../../../../../submission/submission.service';

/**
 * Component representing a group input field
 */
@Component({
  selector: 'ds-dynamic-relation-group',
  styleUrls: ['./dynamic-relation-group.component.scss'],
  templateUrl: './dynamic-relation-group.component.html',
  animations: [shrinkInOut]
})
export class DsDynamicRelationGroupComponent extends DynamicFormControlComponent implements OnDestroy, OnInit {

  @Input() formId: string;
  @Input() group: FormGroup;
  @Input() model: DynamicRelationGroupModel;

  @Output() blur: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();
  @Output() focus: EventEmitter<any> = new EventEmitter<any>();

  public chips: Chips;
  public formCollapsed = observableOf(false);
  public formModel: DynamicFormControlModel[];
  public editMode = false;

  /**
   * The vocabulary entry
   */
  public vocabulary$: Observable<Vocabulary>;
  private selectedChipItem: ChipsItem;
  private selectedChipItemIndex: number;
  private subs: Subscription[] = [];

  @ViewChild('formRef', { static: false }) private formRef: FormComponent;

  constructor(private vocabularyService: VocabularyService,
              private formBuilderService: FormBuilderService,
              private formService: FormService,
              private cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected modalService: NgbModal,
              protected submissionService: SubmissionService
  ) {
    super(layoutService, validationService);
  }

  ngOnInit() {
    const config = { rows: this.model.formConfiguration } as SubmissionFormsModel;
    if (!this.model.isEmpty()) {
      this.formCollapsed = observableOf(true);
    }
    this.model.valueUpdates.subscribe((value: any[]) => {
      if ((isNotEmpty(value) && !(value.length === 1 && hasOnlyEmptyProperties(value[0])))) {
        this.collapseForm();
      } else {
        this.expandForm();
      }
    });

    this.formId = this.formService.getUniqueId(this.model.id);
    this.formModel = this.formBuilderService.modelFromConfiguration(
      this.model.submissionId,
      config,
      this.model.scopeUUID,
      {},
      this.model.submissionScope,
      this.model.readOnly,
      null,
      true);
    this.formBuilderService.addFormModel(this.formId, this.formModel);
    this.initChipsFromModelValue();

    const model = this.getMandatoryFieldModel();
    if (model.vocabularyOptions && isNotEmpty(model.vocabularyOptions.name)) {
      this.retrieveVocabulary(model.vocabularyOptions);
    }
  }

  isMandatoryFieldEmpty() {
    const model = this.getMandatoryFieldModel();
    return model.value == null;
  }

  hasMandatoryFieldAuthority() {
    const model = this.getMandatoryFieldModel();
    return hasValue(model.value)
      && typeof model.value === 'object'
      && (model.value as any).hasAuthority();
  }

  onBlur(event) {
    this.blur.emit();
  }

  onChipSelected(index) {
    this.expandForm();
    this.selectedChipItem = this.chips.getChipByIndex(index);
    this.selectedChipItemIndex = index;
    this.formModel.forEach((row) => {
      const modelRow = row as DynamicFormGroupModel;
      modelRow.group.forEach((model: DynamicInputModel) => {
        const value = (this.selectedChipItem.item[model.name] === PLACEHOLDER_PARENT_METADATA
          || this.selectedChipItem.item[model.name].value === PLACEHOLDER_PARENT_METADATA)
          ? null
          : this.selectedChipItem.item[model.name];

        const nextValue = (this.formBuilderService.isInputModel(model) && isNotNull(value) && (typeof value !== 'string')) ?
          value.value : value;
        model.valueUpdates.next(nextValue);

      });
    });

    this.editMode = true;
  }

  onFocus(event) {
    this.focus.emit(event);
  }

  collapseForm() {
    this.formCollapsed = observableOf(true);
    this.clear();
  }

  expandForm() {
    this.formCollapsed = observableOf(false);
  }

  clear() {
    if (this.editMode) {
      this.selectedChipItem.editMode = false;
      this.selectedChipItem = null;
      this.editMode = false;
    }
    this.resetForm();
    if (!this.model.isEmpty()) {
      this.formCollapsed = observableOf(true);
    }
  }

  save() {
    if (this.editMode) {
      this.modifyChip();
    } else {
      this.addToChips();
    }
  }

  delete() {
    this.chips.remove(this.selectedChipItem);
    this.clear();
  }

  canShowExternalSourceButton(): Observable<boolean> {
    const model = this.getMandatoryFieldModel();
    if ((this.model as any).submissionScope === SubmissionScopeType.WorkflowItem && model.vocabularyOptions && isNotEmpty(model.vocabularyOptions.name)) {
      return this.vocabulary$.pipe(
        filter((vocabulary: Vocabulary) => isNotEmpty(vocabulary)),
        map((vocabulary: Vocabulary) => isNotEmpty(vocabulary.entity) && isNotEmpty(vocabulary.getExternalSourceByMetadata(this.model.mandatoryField)))
      )
    } else {
      return observableOf(false);
    }
  }

  canImport() {
    return !this.isMandatoryFieldEmpty() && this.editMode && !this.hasMandatoryFieldAuthority();
  }

  /**
   * Start the creation of an entity by opening up a collection choice modal window.
   */
  public createEntityFromMetadata(): void {
    this.vocabulary$.pipe(
      filter((vocabulary: Vocabulary) => isNotEmpty(vocabulary)),
      take(1)
    ).subscribe((vocabulary: Vocabulary) => {
      const modalRef = this.modalService.open(VocabularyExternalSourceComponent, {
        size: 'lg',
      });
      modalRef.componentInstance.entityType = vocabulary.entity;
      modalRef.componentInstance.externalSourceIdentifier = vocabulary.getExternalSourceByMetadata(this.model.mandatoryField);
      modalRef.componentInstance.submissionObjectID = this.model.submissionId;
      modalRef.componentInstance.metadataPlace = this.selectedChipItemIndex.toString(10) || '0';

      modalRef.componentInstance.updateAuthority.pipe(take(1)).subscribe((authority) => {
        setTimeout(() => {
          this.updateAuthority(authority);
        }, 100);
      });
    });
  }

  /**
   * Update the model authority value.
   * @param authority
   */
  updateAuthority(authority: string) {
    const model = this.getMandatoryFieldModel();
    const currentValue: string = (model.value instanceof FormFieldMetadataValueObject
      || model.value instanceof VocabularyEntry) ? model.value.value : model.value;
    const valueWithAuthority: any = new FormFieldMetadataValueObject(currentValue, null, authority);
    model.valueUpdates.next(valueWithAuthority);
    this.modifyChip();
    setTimeout(() => {
      this.submissionService.dispatchSave(this.model.submissionId);
    }, 100);
  }

  ngOnDestroy(): void {
    this.subs
      .filter((sub) => hasValue(sub))
      .forEach((sub) => sub.unsubscribe());
    this.formBuilderService.removeFormModel(this.formId);
  }

  private addToChips() {
    if (!this.formRef.formGroup.valid) {
      this.formService.validateAllFormFields(this.formRef.formGroup);
      return;
    }

    // Item to add
    if (!this.isMandatoryFieldEmpty()) {
      const item = this.buildChipItem();
      this.chips.add(item);

      this.resetForm();
    }
  }

  private getMandatoryFieldModel(): DsDynamicInputModel {
    let mandatoryFieldModel = null;
    this.formModel.forEach((row) => {
      const modelRow = row as DynamicFormGroupModel;
      modelRow.group.forEach((model: DynamicInputModel) => {
        if (model.name === this.model.mandatoryField) {
          mandatoryFieldModel = model;
          return;
        }
      });
    });
    return mandatoryFieldModel;
  }

  private modifyChip() {
    if (!this.formRef.formGroup.valid) {
      this.formService.validateAllFormFields(this.formRef.formGroup);
      return;
    }

    if (!this.isMandatoryFieldEmpty()) {
      const item = this.buildChipItem();
      this.chips.update(this.selectedChipItem.id, item);
      this.resetForm();
      this.cdr.detectChanges();
    }
  }

  private buildChipItem() {
    const item = Object.create({});
    this.formModel.forEach((row) => {
      const modelRow = row as DynamicFormGroupModel;
      modelRow.group.forEach((control: DynamicInputModel) => {
        item[control.name] = control.value || PLACEHOLDER_PARENT_METADATA;
      });
    });
    return item;
  }

  private initChipsFromModelValue() {

    let initChipsValue$: Observable<any[]>;
    if (this.model.isEmpty()) {
      this.initChips([]);
    } else {
      initChipsValue$ = observableOf(this.model.value);

      // If authority
      this.subs.push(initChipsValue$.pipe(
        flatMap((valueModel) => {
          const returnList: Array<Observable<any>> = [];
          valueModel.forEach((valueObj) => {
            const returnObj = Object.keys(valueObj).map((fieldName) => {
              let return$: Observable<any>;
              if (isObject(valueObj[fieldName]) && valueObj[fieldName].hasAuthority() && isNotEmpty(valueObj[fieldName].authority)) {
                const fieldId = fieldName.replace(/\./g, '_');
                const model = this.formBuilderService.findById(fieldId, this.formModel);
                return$ = this.vocabularyService.findEntryDetailById(
                  valueObj[fieldName].authority,
                  (model as any).vocabularyOptions.name
                ).pipe(
                  getFirstSucceededRemoteDataPayload(),
                  map((entryDetail: VocabularyEntryDetail) => Object.assign(
                    new FormFieldMetadataValueObject(),
                    valueObj[fieldName],
                    {
                      otherInformation: entryDetail.otherInformation
                    })
                  ));
              } else {
                return$ = observableOf(valueObj[fieldName]);
              }
              return return$.pipe(map((entry) => ({ [fieldName]: entry })));
            });

            returnList.push(combineLatest(returnObj));
          });
          return returnList;
        }),
        mergeMap((valueListObj: Observable<any>, index: number) => {
          return valueListObj.pipe(
            map((valueObj: any) => ({
                index: index, value: valueObj.reduce(
                (acc: any, value: any) => Object.assign({}, acc, value)
                )
              })
            )
          )
        }),
        scan((acc: any[], valueObj: any) => {
          if (acc.length === 0) {
            acc.push(valueObj.value);
          } else {
            acc.splice(valueObj.index, 0, valueObj.value);
          }
          return acc;
        }, []),
        filter((modelValues: any[]) => this.model.value.length === modelValues.length)
      ).subscribe((modelValue) => {
        this.model.valueUpdates.next(modelValue);
        this.initChips(modelValue);
        this.cdr.markForCheck();
      }));
    }
  }

  private initChips(initChipsValue) {
    this.chips = new Chips(
      initChipsValue,
      'value',
      this.model.mandatoryField,
      environment.submission.icons.metadata);
    this.subs.push(
      this.chips.chipsItems
        .subscribe(() => {
          const items = this.chips.getChipsItems();
          // Does not emit change if model value is equal to the current value
          if (!isEqual(items, this.model.value)) {
            if (!(isEmpty(items) && this.model.isEmpty())) {
              this.model.valueUpdates.next(items);
              this.change.emit();
            }
          }
        }),
    );
  }

  private resetForm() {
    if (this.formRef) {
      this.formService.resetForm(this.formRef.formGroup, this.formModel, this.formId);
    }
  }

  private retrieveVocabulary(vocabularyOptions: VocabularyOptions): void {
    this.vocabulary$ = this.vocabularyService.findVocabularyById(vocabularyOptions.name).pipe(
      getFirstSucceededRemoteDataPayload(),
      distinctUntilChanged(),
    );
  }

}
