import { IconName } from '@blueprintjs/icons';
import { Intent } from '@blueprintjs/core/lib/esm/common/intent';

import { JobFailure } from '../webapi';
import {
    ERROR_CODE_CANCELLED,
    ERROR_CODE_INVALID_PARAMS, ERROR_CODE_INVALID_REQUEST, ERROR_CODE_INVALID_RESPONSE,
    ERROR_CODE_METHOD_ERROR,
    ERROR_CODE_METHOD_NOT_FOUND, ERROR_CODE_OS_ERROR,
    ERROR_CODE_OUT_OF_MEMORY
} from '../webapi';


export function getJobFailureIntentName(failure: JobFailure): Intent {
    if (failure) {
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
            case ERROR_CODE_CANCELLED:
                return Intent.PRIMARY;
            case ERROR_CODE_OS_ERROR:
                return Intent.WARNING;
            default:
                return Intent.DANGER;
        }
    }
    return Intent.WARNING;
}

export function getJobFailureIcon(failure: JobFailure): IconName {
    if (failure) {
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
                return 'info-sign';
            case ERROR_CODE_CANCELLED:
                return 'hand';
            default:
                return 'error';
        }
    }
    return 'warning-sign';
}

export function getJobFailureTitle(failure: JobFailure): string {

    if (failure) {
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
                return 'Invalid Input';
            case ERROR_CODE_OUT_OF_MEMORY:
                return 'Out-Of-Memory Error';
            case ERROR_CODE_OS_ERROR:
                return 'External Problem';
            case ERROR_CODE_CANCELLED:
                return 'Task Cancelled';
            case ERROR_CODE_METHOD_NOT_FOUND:
                return 'Internal Error (Method Not Found)';
            case ERROR_CODE_INVALID_REQUEST:
                return 'Internal Error (Invalid Request)';
            case ERROR_CODE_INVALID_RESPONSE:
                return 'Internal Error (Invalid Response)';
            case ERROR_CODE_METHOD_ERROR:
                return 'Operation Error';
        }
    }

    return 'Unknown Error';
}
