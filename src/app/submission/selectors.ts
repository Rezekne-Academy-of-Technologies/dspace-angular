import { createSelector, MemoizedSelector, Selector } from '@ngrx/store';

import { hasValue } from '../shared/empty.util';
import { submissionSelector, SubmissionState } from './submission.reducers';
import { SubmissionObjectEntry, SubmissionSectionObject } from './objects/submission-objects.reducer';
import { MetadataSecurityConfiguration } from '../core/submission/models/metadata-security-configuration';

/**
 * Export a function to return a subset of the state by key
 */
export function keySelector<T, V>(parentSelector: Selector<any, any>, subState: string, key: string): MemoizedSelector<T, V> {
  return createSelector(parentSelector, (state: T) => {
     if (hasValue(state) && hasValue(state[subState])) {
      return state[subState][key];
    } else {
      return undefined;
    }
  });
}

/**
 * Export a function to return a subset of the state
 */
export function subStateSelector<T, V>(parentSelector: Selector<any, any>, subState: string): MemoizedSelector<T, V> {
  return createSelector(parentSelector, (state: T) => {
    if (hasValue(state) && hasValue(state[subState])) {
      return state[subState];
    } else {
      return undefined;
    }
  });
}

export function submissionObjectFromIdSelector(submissionId: string): MemoizedSelector<SubmissionState, SubmissionObjectEntry> {
  return keySelector<SubmissionState, SubmissionObjectEntry>(submissionSelector, 'objects', submissionId);
}

export function submissionObjectSectionsFromIdSelector(submissionId: string): MemoizedSelector<SubmissionState, SubmissionObjectEntry> {
  const submissionObjectSelector = submissionObjectFromIdSelector(submissionId);
  return subStateSelector<SubmissionState, SubmissionObjectEntry>(submissionObjectSelector, 'sections');
}

export function submissionUploadedFilesFromIdSelector(submissionId: string, sectionId: string): MemoizedSelector<SubmissionState, any> {
  const sectionDataSelector = submissionSectionDataFromIdSelector(submissionId, sectionId);
  return subStateSelector<SubmissionState, SubmissionObjectEntry>(sectionDataSelector, 'files');
}

export function submissionUploadedFileFromUuidSelector(submissionId: string, sectionId: string, uuid: string): MemoizedSelector<SubmissionState, any> {
  const filesSelector = submissionSectionDataFromIdSelector(submissionId, sectionId);
  return keySelector<SubmissionState, any>(filesSelector, 'files', uuid);
}

export function submissionSectionFromIdSelector(submissionId: string, sectionId: string): MemoizedSelector<SubmissionState, any> {
  const submissionIdSelector = submissionObjectFromIdSelector(submissionId);
  return keySelector<SubmissionState, SubmissionObjectEntry>(submissionIdSelector, 'sections', sectionId);
}

export function submissionSectionDataFromIdSelector(submissionId: string, sectionId: string): MemoizedSelector<SubmissionState, any> {
  const submissionIdSelector = submissionSectionFromIdSelector(submissionId, sectionId);
  return subStateSelector<SubmissionState, SubmissionSectionObject>(submissionIdSelector, 'data');
}

export function submissionSectionErrorsFromIdSelector(submissionId: string, sectionId: string): MemoizedSelector<SubmissionState, any> {
  const submissionIdSelector = submissionSectionFromIdSelector(submissionId, sectionId);
  return subStateSelector<SubmissionState, SubmissionSectionObject>(submissionIdSelector, 'errorsToShow');
}


export function submissionSectionServerErrorsFromIdSelector(submissionId: string, sectionId: string): MemoizedSelector<SubmissionState, any> {
  const submissionIdSelector = submissionSectionFromIdSelector(submissionId, sectionId);
  return subStateSelector<SubmissionState, SubmissionSectionObject>(submissionIdSelector, 'serverValidationErrors');
}

export function securityConfigurationObjectFromIdSelector(submissionId: string): MemoizedSelector<SubmissionState, MetadataSecurityConfiguration> {
  const submissionIdSelector  = submissionObjectFromIdSelector(submissionId);
  return subStateSelector<SubmissionState, MetadataSecurityConfiguration>(submissionIdSelector, 'metadataSecurityConfiguration');
}
