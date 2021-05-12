import { Inject } from '@angular/core';
import { FormFieldModel } from '../models/form-field.model';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import {
  DynamicFormControlLayout,
  DynamicInputModel,
  DynamicInputModelConfig
} from '@ng-dynamic-forms/core';
import {
  CONCAT_FIRST_INPUT_SUFFIX,
  CONCAT_GROUP_SUFFIX,
  CONCAT_SECOND_INPUT_SUFFIX,
  DynamicConcatModel,
  DynamicConcatModelConfig
} from '../ds-dynamic-form-ui/models/ds-dynamic-concat.model';
import { hasNoValue, hasValue, isNotEmpty } from '../../../empty.util';
import { ParserOptions } from './parser-options';
import {
  CONFIG_DATA,
  FieldParser,
  INIT_FORM_VALUES,
  PARSER_OPTIONS,
  SUBMISSION_ID
} from './field-parser';

export class ConcatFieldParser extends FieldParser {

  constructor(
    @Inject(SUBMISSION_ID) submissionId: string,
    @Inject(CONFIG_DATA) configData: FormFieldModel,
    @Inject(INIT_FORM_VALUES) initFormValues,
    @Inject(PARSER_OPTIONS) parserOptions: ParserOptions,
    protected separator: string,
    protected firstPlaceholder: string = null,
    protected secondPlaceholder: string = null) {
    super(submissionId, configData, initFormValues, parserOptions);

    this.separator = separator;
    this.firstPlaceholder = firstPlaceholder;
    this.secondPlaceholder = secondPlaceholder;
  }

  public modelFactory(fieldValue?: FormFieldMetadataValueObject | any, label?: boolean): any {

    let clsGroup: DynamicFormControlLayout;
    let clsInput1: DynamicFormControlLayout;
    let clsInput2: DynamicFormControlLayout;
    const id: string = this.configData.selectableMetadata[0].metadata;

    clsInput1 = {
      grid: {
        host: 'col-sm-6'
      }
    };
    clsInput2 = {
      grid: {
        host: 'col-sm-6 d-flex flex-column justify-content-start'
      }
    };

    const groupId = id.replace(/\./g, '_') + CONCAT_GROUP_SUFFIX;
    const concatGroup: DynamicConcatModelConfig = this.initModel(groupId, label, false, true);

    concatGroup.group = [];
    concatGroup.separator = this.separator;

    const input1ModelConfig: DynamicInputModelConfig = this.initModel(
      id + CONCAT_FIRST_INPUT_SUFFIX,
      false,
      true,
      true,
      false
    );
    const input2ModelConfig: DynamicInputModelConfig = this.initModel(
      id + CONCAT_SECOND_INPUT_SUFFIX,
      false,
      true,
      true,
      false
    );

    if (hasNoValue(concatGroup.hint) && hasValue(input1ModelConfig.hint) && hasNoValue(input2ModelConfig.hint)) {
      concatGroup.hint = input1ModelConfig.hint;
      input1ModelConfig.hint = undefined;
    }

    if (this.configData.mandatory) {
      concatGroup.required = true;
      input1ModelConfig.required = true;
      input2ModelConfig.required = true;
    }

    if (isNotEmpty(this.firstPlaceholder)) {
      input1ModelConfig.placeholder = this.firstPlaceholder;
    }

    if (isNotEmpty(this.secondPlaceholder)) {
      input2ModelConfig.placeholder = this.secondPlaceholder;
    }

    // Split placeholder if is like 'placeholder1/placeholder2'
    const placeholder = this.configData.label.split('/');
    if (placeholder.length === 2) {
      input1ModelConfig.placeholder = placeholder[0];
      input2ModelConfig.placeholder = placeholder[1];
    }

    const model1 = new DynamicInputModel(input1ModelConfig, clsInput1);
    const model2 = new DynamicInputModel(input2ModelConfig, clsInput2);
    concatGroup.group.push(model1);
    concatGroup.group.push(model2);

    clsGroup = {
      element: {
        control: 'form-row',
      }
    };
    const concatModel = new DynamicConcatModel(concatGroup, clsGroup);
    concatModel.name = this.getFieldId();

    // Init values
    if (isNotEmpty(fieldValue)) {
      concatModel.value = fieldValue;
    }

    return concatModel;
  }

}
