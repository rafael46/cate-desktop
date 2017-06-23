import * as React from 'react';
import {
    State, WorkspaceState, VariableImageLayerState, VariableVectorLayerState,
    VariableState, VariableRefState, VectorLayerState, ResourceState, WorldViewDataState, GeographicPosition, Placemark
} from "../state";
import {
    CesiumGlobe, LayerDescriptor, ImageryProvider, DataSourceDescriptor,
    DataSource, GeoJsonDataSource
} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";
import {
    findVariable, findResource, getTileUrl, getGeoJSONUrl, getGeoJSONCountriesUrl,
    COUNTRIES_LAYER_ID, SELECTED_VARIABLE_LAYER_ID
} from "../state-util";
import {ViewState} from "../components/ViewState";
import * as selectors from "../selectors";
import * as actions from "../actions";

const Cesium: any = require('cesium');

interface IGlobeViewOwnProps {
    view: ViewState<WorldViewDataState>;
    disposer: any;
}

interface IGlobeViewProps extends IGlobeViewOwnProps {
    dispatch?: (action: any) => void;
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    worldViewClickAction: string | null;
    placemarks: Placemark[];
    selectedPlacemarkId: string | null;
    isDialogOpen: boolean;
}

function mapStateToProps(state: State, ownProps: IGlobeViewOwnProps): IGlobeViewProps {
    return {
        view: ownProps.view,
        disposer: ownProps.disposer,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        workspace: selectors.workspaceSelector(state),
        offlineMode: state.session.offlineMode,
        worldViewClickAction: state.control.worldViewClickAction,
        placemarks: selectors.placemarksSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        isDialogOpen: selectors.isDialogOpenSelector(state),
    };
}

/**
 * This component displays a 3D globe with a number of layers.
 */
class GlobeView extends React.Component<IGlobeViewProps & IGlobeViewOwnProps, null> {
    static readonly CESIUM_GLOBE_STYLE = {width: "100%", height: "100%", overflow: "hidden"};

    constructor(props: IGlobeViewProps & IGlobeViewOwnProps) {
        super(props);
        this.handleMouseMoved = this.handleMouseMoved.bind(this);
        this.handleMouseClicked = this.handleMouseClicked.bind(this);
        this.handleLeftUp = this.handleLeftUp.bind(this);
        this.handlePlacemarkSelected = this.handlePlacemarkSelected.bind(this);
    }

    handleMouseMoved(position: GeographicPosition) {
        this.props.dispatch(actions.setGlobeMousePosition(position));
    }

    handleMouseClicked(position: GeographicPosition) {
        if (this.props.worldViewClickAction === actions.ADD_PLACEMARK && position) {
            this.props.dispatch(actions.addPlacemark(position));
            this.props.dispatch(actions.updateControlState({worldViewClickAction: null}));
        }
    }

    handleLeftUp(position: GeographicPosition) {
        this.props.dispatch(actions.setGlobeViewPosition(position));
    }

    handlePlacemarkSelected(selectedPlacemarkId: string | null) {
        this.props.dispatch(actions.setSelectedPlacemarkId(selectedPlacemarkId));
    }

    render() {
        const placemarks = this.props.placemarks;
        const layers = [];
        const dataSources = [];
        // TODO (forman): optimize me: increase speed and clean up code by moving the following into selectors.ts
        if (this.props.workspace && this.props.workspace.resources && this.props.view.data.layers) {
            for (let layer of this.props.view.data.layers) {
                switch (layer.type) {
                    case 'VariableImage': {
                        const layerDescriptor = this.convertVariableImageLayerToLayerDescriptor(layer as VariableImageLayerState);
                        layers.push(layerDescriptor);
                        break;
                    }
                    case 'VariableVector': {
                        const dataSourceDescriptor = this.convertVariableVectorLayerToDataSourceDescriptor(layer as VariableVectorLayerState);
                        dataSources.push(dataSourceDescriptor);
                        break;
                    }
                    case 'Vector': {
                        const dataSourceDescriptor = this.convertVectorLayerToDataSourceDescriptor(layer as VectorLayerState);
                        dataSources.push(dataSourceDescriptor);
                        break;
                    }
                    default: {
                        if (layer.id !== SELECTED_VARIABLE_LAYER_ID) {
                            console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
                        }
                        break;
                    }
                }
            }
        }

        return (
            <CesiumGlobe id={'CesiumGlobe-' + this.props.view.id}
                         debug={false}
                         selectedPlacemarkId={this.props.selectedPlacemarkId}
                         placemarks={placemarks}
                         layers={layers}
                         dataSources={dataSources}
                         offlineMode={this.props.offlineMode}
                         style={GlobeView.CESIUM_GLOBE_STYLE}
                         onMouseMoved={this.props.isDialogOpen ? null : this.handleMouseMoved}
                         onMouseClicked={this.props.isDialogOpen ? null : this.handleMouseClicked}
                         onLeftUp={this.props.isDialogOpen ? null : this.handleLeftUp}
                         onPlacemarkSelected={this.handlePlacemarkSelected}
            />
        );
    }

    private getResource(ref: VariableRefState): ResourceState {
        return findResource(this.props.workspace.resources, ref);
    }

    private getVariable(ref: VariableRefState): VariableState {
        return findVariable(this.props.workspace.resources, ref);
    }

    private convertVariableImageLayerToLayerDescriptor(layer: VariableImageLayerState): LayerDescriptor | null {
        const resource = this.getResource(layer);
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            return null;
        }
        const imageLayout = variable.imageLayout;
        if (!variable.imageLayout) {
            console.warn(`MapView: variable "${layer.varName}" of resource "${layer.resName}" has no imageLayout`);
            return null;
        }
        const baseDir = this.props.workspace.baseDir;
        const url = getTileUrl(this.props.baseUrl, baseDir, layer);
        let rectangle = Cesium.Rectangle.MAX_VALUE;
        if (imageLayout.sector) {
            const sector = imageLayout.sector;
            rectangle = Cesium.Rectangle.fromDegrees(sector.west, sector.south, sector.east, sector.north);
        }
        return Object.assign({}, layer, {
            imageryProvider: GlobeView.createImageryProvider,
            imageryProviderOptions: {
                url,
                rectangle,
                minimumLevel: 0,
                maximumLevel: imageLayout.numLevels - 1,
                tileWidth: imageLayout.tileWidth,
                tileHeight: imageLayout.tileHeight,
                tilingScheme: new Cesium.GeographicTilingScheme({
                    rectangle,
                    numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                    numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
                }),
            },
        });
    }

    private convertVariableVectorLayerToDataSourceDescriptor(layer: VariableVectorLayerState): DataSourceDescriptor | null {
        const resource = this.getResource(layer);
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            return null;
        }

        const baseDir = this.props.workspace.baseDir;
        const url = getGeoJSONUrl(this.props.baseUrl, baseDir, layer);
        const dataSourceName = `${resource.name} / ${variable.name}`;

        const dataSource = (dataSourceOptions) => {
            let numFeatures = 0;
            const customDataSource: DataSource = new Cesium.CustomDataSource(dataSourceOptions.name);
            const worker = new Worker("common/stream-geojson.js");
            worker.postMessage(dataSourceOptions.url);
            worker.onmessage = function (event: MessageEvent) {
                const features = event.data;
                if (!features) {
                    customDataSource.update(Cesium.JulianDate.now());
                    console.log(`${numFeatures} feature(s) received from ${url}`);
                    return;
                }
                numFeatures += features.length;
                for (let feature of features) {
                    // Add basic styling, see https://github.com/mapbox/simplestyle-spec
                    feature.properties = Object.assign(feature.properties, {
                        "stroke": "#555555",
                        "stroke-opacity": 1.0,
                        "stroke-width": 2,
                        "fill": "#555555",
                        "fill-opacity": 0.5
                    });
                }
                Cesium.GeoJsonDataSource.load({type: 'FeatureCollection', features: features})
                    .then((geoJsonDataSource: GeoJsonDataSource) => {
                        geoJsonDataSource.entities.suspendEvents();
                        customDataSource.entities.suspendEvents();
                        //console.log('new geoJsonDataSource: ', geoJsonDataSource);
                        const entities = geoJsonDataSource.entities.values.slice();
                        for (let entity of entities) {
                            geoJsonDataSource.entities.remove(entity);
                            customDataSource.entities.add(entity);
                        }
                        customDataSource.entities.resumeEvents();
                        // customDataSource.update(Cesium.JulianDate.now());
                    });
            };
            return customDataSource;
        };

        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            dataSource,
            dataSourceOptions: {url, name: dataSourceName},
        };
    }

    private convertVectorLayerToDataSourceDescriptor(layer: VectorLayerState): DataSourceDescriptor | null {
        let url = layer.url;
        if (layer.id === COUNTRIES_LAYER_ID) {
            url = getGeoJSONCountriesUrl(this.props.baseUrl);
        }
        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            dataSource: GlobeView.createGeoJsonDataSource,
            dataSourceOptions: {url},
        };
    }

    /**
     * Creates a Cesium.UrlTemplateImageryProvider instance.
     *
     * @param imageryProviderOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
     */
    private static createImageryProvider(imageryProviderOptions): ImageryProvider {
        const imageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
        imageryProvider.errorEvent.addEventListener((event) => {
            console.error('GlobeView:', event);
        });
        return imageryProvider;
    }

    /**
     * Creates a Cesium.GeoJsonDataSource instance.
     *
     * @param dataSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
     */
    private static createGeoJsonDataSource(dataSourceOptions): DataSource {
        return Cesium.GeoJsonDataSource.load(dataSourceOptions.url, {
            stroke: Cesium.Color.ORANGE,
            fill: new Cesium.Color(0, 0, 0, 0),
            strokeWidth: 5,
            markerSymbol: '?'
        });
    }

}

export default connect(mapStateToProps)(GlobeView);
