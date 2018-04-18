import * as React from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';

export const ICON_CIRCLE = IconNames.CIRCLE;
export const ICON_DISABLE = IconNames.DISABLE;

export const CONFIG_ERROR_MESSAGE = (
    <span>This is very likely a configuration error, please check <code>.cate/webapi.log</code> file.</span>
);

export const NO_WORKSPACE = (
    <NonIdealState
        title="No workspace"
        description={<span>Try <strong>File / New</strong> or <strong>File / Open</strong> from the main menu.</span>}
        visual={ICON_CIRCLE}/>
);

export const NO_WORKSPACE_RESOURCES = (
    <NonIdealState
        title="No workspace resources"
        visual={IconNames.DATABASE}
        description={<span>Open a dataset in DATA SOURCES panel or add a <code>read_</code> operation step from the OPERATIONS panel.</span>}
    />
);

export const NO_WORKFLOW_STEPS = (
    <NonIdealState
        title="No workflow steps"
        visual={IconNames.FLOWS}
        description={<span>Open a dataset in DATA SOURCES panel or add a <code>read_</code> operation step from the OPERATIONS panel.</span>}
    />
);

export const NO_DATA_STORES_FOUND = (
    <NonIdealState
        title="No data stores found"
        visual={IconNames.OFFLINE}
        description={CONFIG_ERROR_MESSAGE}/>
);

export const NO_LOCAL_DATA_SOURCES = (
    <NonIdealState
        title="No local data sources"
        visual={ICON_CIRCLE}
        description={<span>Add new local data sources using the <code>cate ds add <em>name</em> <em>files...</em></code> command-line</span>}/>
);

export const NO_DATA_SOURCES_FOUND = (
    <NonIdealState
        title="No data sources found"
        visual={ICON_CIRCLE}
        description={CONFIG_ERROR_MESSAGE}/>
);

export const NO_OPERATIONS_FOUND = (
    <NonIdealState
        title="No operations found"
        description={CONFIG_ERROR_MESSAGE}
        visual={ICON_CIRCLE}/>
);

export const NO_VARIABLES = (
    <NonIdealState
        title="No variables"
        visual={ICON_CIRCLE}
        description={`Select a resource in the WORKSPACE panel first.`}/>
);

export const NO_VARIABLES_EMPTY_RESOURCE = (resourceName) => (
    <NonIdealState
        title="No variables"
        visual={ICON_CIRCLE}
        description={`Selected resource "${resourceName}" doesn't contain any variables.`}/>
);

export const NO_ACTIVE_VIEW = (
    <NonIdealState
        title="No active view"
        description="Add a new view first."
        visual={ICON_CIRCLE}/>
);

export const NO_WEB_GL = (
    <NonIdealState
        title="Can't open world view"
        description="Cate's world view component requires WebGL, which doesn't seem to be supported by your environment. This is likely on virtualized HW with low graphics capabilities. Sorry!"
        visual={ICON_DISABLE}/>
);

export const NO_PLACES = (
    <NonIdealState
        title="No places"
        description={<span>Press the <span className="selection"/> or <span className="add"/> button to add a place.</span>}
        visual={ICON_CIRCLE}/>
);

export const NO_PLACE_SELECTED = (
    <NonIdealState
        title="No place selected"
        description="Select a place to show and edit its details."
        visual={ICON_CIRCLE}/>
);

export const NO_LAYERS_NO_VIEW = (
    <NonIdealState
        title="No layers"
        description="To show layers, activate a world view"
        visual={ICON_CIRCLE}/>
);

export const NO_LAYERS_EMPTY_VIEW = (
    <NonIdealState
        title="No layers"
        description={<span>Press the <span className="add"/> button to add a layer.</span>}
        visual={ICON_CIRCLE}/>
);

export const NO_LAYER_SELECTED = (
    <NonIdealState
        title="No layer selected"
        description="Select a layer to browse and edit its details."
        visual={ICON_CIRCLE}/>
);

export const NO_LAYER_FOR_STYLE = (
    <NonIdealState
        title="Styles unavailable"
        description="Select a layer in the LAYERS panel to modify its style."
        visual={ICON_CIRCLE}/>
);

export const NO_ENTITY_FOR_STYLE = (
    <NonIdealState
        title="Styles unavailable"
        description="Select an entity in the World View to modify its style."
        visual={ICON_CIRCLE}/>
);

export const NO_CHARTS = (
    <NonIdealState
        title="No charts"
        description={<span>Press the <span className="add"/> button to add a new chart.</span>}
        visual={ICON_CIRCLE}/>
);

export const NO_TABLE_DATA = (
    <NonIdealState
        title="No table data"
        description={<span>The resource seems to be empty or an error occurred.</span>}
        visual={ICON_CIRCLE}/>
);

export const LOADING_TABLE_DATA_FAILED = (error: any) => (
    <NonIdealState
        title="Loading table data failed"
        description={<span>{`${error}`}</span>}
        visual={ICON_CIRCLE}/>
);