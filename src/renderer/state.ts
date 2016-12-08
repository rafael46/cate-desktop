import  {WebAPIClient} from './webapi';

/**
 * Interface describing Cate's application state structure.
 * Cate's application state is a giant, structured, plain JavaScript object.
 *
 * It is modelled after the principles explained in http://jamesknelson.com/5-types-react-application-state/.
 *
 * @author Norman Fomferra
 */

export interface State {
    data: DataState;
    communication: CommunicationState;
    control: ControlState;
    session: SessionState;
    location: LocationState; // not used
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DataState

/**
 * Cate's domain data which is usually received from the Cate WebAPI service.
 */
export interface DataState {
    appConfig: AppConfigState; // TBD: move this to session?
    dataStores: Array<DataStoreState> | null;
    operations: Array<OperationState> | null;
    workspace: WorkspaceState | null;
}

export interface AppConfigState {
    // TODO (nf): I don't like the webAPIClient here in the state object.
    // Maybe put it into the communication state, see http://jamesknelson.com/5-types-react-application-state/
    // and see https://github.com/trbngr/react-example-pusher
    webAPIClient: WebAPIClient | null;
    webAPIConfig: WebAPIConfig;
}

export interface WebAPIConfig {
    // Values read by main.ts from ./cate-config.js
    command?: string;
    servicePort: number;
    serviceAddress: string;
    serviceFile?:  string;
    processOptions?: Object;
    disabled?: boolean;
    // Values computed in main.ts
    restUrl: string;
    webSocketUrl: string;
}

export interface DataStoreState {
    id: string;
    name: string;
    description: string;
    dataSources?: Array<DataSourceState> | null;
}

export interface DataSourceState {
    id: string;
    name: string;
    meta_info: any | null;
}

export interface OperationState {
    name: string;
    description?: string;
    tags?: Array<string>;
    inputs: Array<OperationInputState>;
    outputs: Array<OperationOutputState>;
}

export interface OperationInputState {
    name: string;
    description: string;
    dataType: string;
    valueSet?: Array<any>;
    valueRange?: Array<any>;
}

export interface OperationOutputState {
    name: string;
    description: string;
    dataType: string;
}

export interface WorkspaceState {
    path: null;
    isOpen: boolean;
    isSaved: boolean;
    workflow: WorkflowState;
    description?: string|null;
}

export interface WorkflowState {
    steps: Array<WorkflowStepState>;
}

export interface WorkflowStepState {
    id: string;
    type: string;
    action: string;
    description?: string;
    inputs: Array<WorkflowStepPortState>;
    outputs: Array<WorkflowStepPortState>;
}

export interface WorkflowStepPortState {
    name: string;
    dataType?: string;
    description?: string;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CommunicationState

/**
 * Communication state is the status of any not-yet-complete requests to other services.
 */
export interface CommunicationState {
    webAPIStatus: 'connecting'|'open'|'error'|'closed'|null;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ControlState

/**
 * Control State is state which is specific to a given container component, and which is not stored in the screen’s
 * URL or in the HTML5 History API.
 */
export interface ControlState {
    // DataSourcesPanel
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;

    // OperationsPanel
    selectedOperationName: string|null;
    operationFilterTags: Array<string>;
    operationFilterExpr: string;

    // WorkspacePanel
    selectedWorkflowStepId: string|null;
    selectedWorkflowResourceId: string|null;

    // A map that stores the state of any dialog given a dialogId
    dialogs: {[dialogId:string]:DialogState;};
}

export interface DialogState {
    isOpen?: boolean;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionState

/**
 * Session state contains information about the human being which is currently using Cate.
 * Session state is only ever read when a component is mounted.
 * Session state can be used to save preferences.
 */
export interface SessionState {
    lastDir?: string;
    mainWindowBounds?: {x:number; y:number; width: number; height: number};
    devToolsOpened?: boolean;
    lastWorkspacePath?: string,
    openLastWorkspace?: boolean,
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LocationState

/**
 * Location state is the information stored in the URL and the HTML5 History state object.
 */
export interface LocationState {
}
