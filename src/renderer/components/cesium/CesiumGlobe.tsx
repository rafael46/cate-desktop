import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {arrayDiff} from "../../../common/array-diff";
import * as assert from "../../../common/assert";
import {Feature, Point} from "geojson";
import {SplitSlider} from "./SplitSlider";
import * as Cesium from "cesium";
import {diff} from "deep-object-diff";

interface Placemark extends Feature<Point> {
    id: string;
}

const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');

/**
 * Describes a layer to be displayed on the Cesium globe.
 */
export interface LayerDescriptor {
    id: string;
    name?: string | null;
    visible: boolean;
}

/**
 * Describes an image layer (imagery provider) to be displayed on the Cesium globe.
 */
export interface ImageLayerDescriptor extends LayerDescriptor {
    opacity?: number;
    brightness?: number;
    contrast?: number;
    hue?: number;
    saturation?: number;
    gamma?: number;

    imageryProvider: ((viewer: Cesium.Viewer, options: any) => Cesium.ImageryProvider) | Cesium.ImageryProvider;
    imageryProviderOptions: any;
}

/**
 * Describes a vector data layer (entity data source) to be displayed on the Cesium globe.
 */
export interface VectorLayerDescriptor extends LayerDescriptor {
    dataSource?: ((viewer: Cesium.Viewer, options: any) => Cesium.DataSource) | Cesium.DataSource;
    dataSourceOptions?: any;
}

export interface LayerDescriptors {
    vectorLayerDescriptors?: VectorLayerDescriptor[];
    imageLayerDescriptors?: ImageLayerDescriptor[];
}

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


interface CesiumGlobeState {
    selectedPlacemarkId?: string;
    placemarks?: Placemark[];
    layers?: ImageLayerDescriptor[];
    dataSources?: VectorLayerDescriptor[];
    overlayHtml?: HTMLElement | null;
    splitLayerIndex?: number;
    splitLayerPos?: number;
}

export interface ICesiumGlobeProps extends IExternalObjectComponentProps<Cesium.Viewer, CesiumGlobeState>, CesiumGlobeState {
    offlineMode?: boolean;
    dataSources?: VectorLayerDescriptor[];
    onMouseClicked?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onMouseMoved?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onLeftUp?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onSelectedEntityChanged?: (selectedEntity: Cesium.Entity | null) => void;
    onViewerMounted?: (id: string, viewer: Cesium.Viewer) => void;
    onViewerUnmounted?: (id: string, viewer: Cesium.Viewer) => void;
    splitLayerIndex: number;
    splitLayerPos: number;
    onSplitLayerPosChange: (splitLayerPos: number) => void;
}

const CENTRAL_EUROPE_BOX = Cesium.Rectangle.fromDegrees(-30, 20, 40, 80);
const EMPTY_ARRAY = [];
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = CENTRAL_EUROPE_BOX;
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

/**
 * A component that wraps a Cesium 3D Globe.
 *
 * @author Norman Fomferra
 */
export class CesiumGlobe extends ExternalObjectComponent<Cesium.Viewer, CesiumGlobeState, ICesiumGlobeProps, null> {
    private mouseClickHandler: any;
    private mouseMoveHandler: any;
    private leftUpHandler: any;
    private selectedEntityChangeHandler: any;

    constructor(props: ICesiumGlobeProps) {
        super(props);
        this.handleRemoteBaseLayerError = this.handleRemoteBaseLayerError.bind(this);
    }

    protected renderChildren() {
        return (<SplitSlider splitPos={this.props.splitLayerPos}
                             onChange={this.props.onSplitLayerPosChange}
                             visible={this.props.splitLayerIndex >= 0}/>);
    }

    newContainer(id: string): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + id);
        div.setAttribute("style", "width: 100%; height: 100%; overflow: hidden;");
        return div;
    }

    newExternalObject(parentContainer: HTMLElement, container: HTMLElement): Cesium.Viewer {

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            baseLayerImageryProvider = CesiumGlobe.getStaticNaturalEarthImageryProvider();
        } else {
            baseLayerImageryProvider = new Cesium.BingMapsImageryProvider({url: 'http://dev.virtualearth.net'});
            baseLayerImageryProvider.errorEvent.addEventListener(this.handleRemoteBaseLayerError);
        }

        const cesiumViewerOptions = {
            animation: false,
            baseLayerPicker: false,
            selectionIndicator: true,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: true,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: 'creditContainer',
            imageryProvider: baseLayerImageryProvider,
            navigationInstructionsInitiallyVisible: false,
            automaticallyTrackDataSourceClocks: false,
        };

        // Create the CesiumCesium.Viewer
        //noinspection UnnecessaryLocalVariableJS
        const viewer = new Cesium.Viewer(container, cesiumViewerOptions);

        // knockout is used by Cesium to update the style attributes of the selectionIndicator
        // when using multiple views this breaks, for unknown reason
        // to get this working we update the 'style' attribute of the selectionIndicatorElement manually
        // https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Widgets/SelectionIndicator/SelectionIndicatorViewModel.js
        const viewModel = viewer.selectionIndicator.viewModel;
        const originalUpdate = viewModel.update;
        viewModel.update = function () {
            originalUpdate.apply(this);
            const styleValue = `top : ${viewModel._screenPositionY}; left : ${viewModel._screenPositionX};`;
            viewModel._selectionIndicatorElement.setAttribute('style', styleValue);
        };

        return viewer;
    }

    private handleRemoteBaseLayerError(event) {
        console.error('CesiumGlobe: error: ', event.message, event.timesRetried, event.error);
        let ref = this.getExternalObjectRef();
        if (ref) {
            const viewer: Cesium.Viewer = ref.object;
            // On error, exchange the remote base layer with a static one.
            let imageryLayer = viewer.imageryLayers.get(0);
            viewer.imageryLayers.remove(imageryLayer, true);
            let staticNaturalEarthImageryProvider = CesiumGlobe.getStaticNaturalEarthImageryProvider();
            viewer.imageryLayers.addImageryProvider(staticNaturalEarthImageryProvider, 0);
        }
    }

    private static getStaticNaturalEarthImageryProvider() {
        const baseUrl = Cesium.buildModuleUrl('');
        const imageryProviderOptions = {
            url: baseUrl + 'Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg',
            tilingScheme: new Cesium.GeographicTilingScheme(),
            minimumLevel: 0,
            maximumLevel: 2,
            credit: 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
        };
        return new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
    }

    propsToExternalObjectState(props: ICesiumGlobeProps & CesiumGlobeState): CesiumGlobeState {
        const selectedPlacemarkId = this.props.selectedPlacemarkId;
        const placemarks = this.props.placemarks || EMPTY_ARRAY;
        const layers = this.props.layers || EMPTY_ARRAY;
        const dataSources = this.props.dataSources || EMPTY_ARRAY;
        const overlayHtml = this.props.overlayHtml || null;
        const splitLayerIndex = this.props.splitLayerIndex;
        const splitLayerPos = this.props.splitLayerPos;
        return {
            selectedPlacemarkId,
            placemarks,
            layers,
            dataSources,
            overlayHtml,
            splitLayerIndex,
            splitLayerPos
        };
    }

    updateExternalObject(viewer: Cesium.Viewer, prevState: CesiumGlobeState, nextState: CesiumGlobeState): void {

        const prevSelectedPlacemarkId = (prevState && prevState.selectedPlacemarkId) || null;
        const prevPlacemarks = (prevState && prevState.placemarks) || EMPTY_ARRAY;
        const prevLayers = (prevState && prevState.layers) || EMPTY_ARRAY;
        const prevDataSources = (prevState && prevState.dataSources) || EMPTY_ARRAY;
        const prevOverlayHtml = (prevState && prevState.overlayHtml) || null;
        const prevSplitLayerIndex = (prevState && prevState.splitLayerIndex);
        const prevSplitLayerPos = (prevState && prevState.splitLayerPos);

        const nextSelectedPlacemarkId = nextState.selectedPlacemarkId || null;
        const nextPlacemarks = nextState.placemarks || EMPTY_ARRAY;
        const nextLayers = nextState.layers || EMPTY_ARRAY;
        const nextDataSources = nextState.dataSources || EMPTY_ARRAY;
        const nextOverlayHtml = nextState.overlayHtml;
        const nextSplitLayerIndex = nextState.splitLayerIndex;
        const nextSplitLayerPos = nextState.splitLayerPos;

        if (prevPlacemarks !== nextPlacemarks) {
            this.updateGlobePlacemarks(viewer, prevPlacemarks, nextPlacemarks);
        }
        if (prevLayers !== nextLayers) {
            this.updateGlobeLayers(viewer, prevLayers, nextLayers);
        }
        if (prevDataSources !== nextDataSources) {
            this.updateGlobeDataSources(viewer, prevDataSources, nextDataSources);
        }
        if (prevSelectedPlacemarkId !== nextSelectedPlacemarkId) {
            this.updateGlobeSelectedPlacemark(viewer, nextSelectedPlacemarkId);
        }
        if (prevOverlayHtml !== nextOverlayHtml) {
            CesiumGlobe.updateOverlayHtml(viewer, prevOverlayHtml, nextOverlayHtml);
        }
        if (prevSplitLayerIndex !== nextSplitLayerIndex) {
            CesiumGlobe.updateSplitLayers(viewer, prevSplitLayerIndex, nextSplitLayerIndex);
        }
        if (prevSplitLayerPos !== nextSplitLayerPos) {
            viewer.scene.imagerySplitPosition = nextSplitLayerPos;
        }
    }

    externalObjectMounted(viewer: Cesium.Viewer): void {
        this.mouseClickHandler = new Cesium.ScreenSpaceEventHandler();
        this.mouseClickHandler.setInputAction(
            (event) => {
                const cartographic = screenToCartographic(viewer, event.position, true);
                if (this.props.onMouseClicked) {
                    this.props.onMouseClicked(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        this.mouseMoveHandler = new Cesium.ScreenSpaceEventHandler();
        this.mouseMoveHandler.setInputAction(
            (event) => {
                const point = event.endPosition;
                const cartographic = screenToCartographic(viewer, point, true);
                if (this.props.onMouseMoved) {
                    this.props.onMouseMoved(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        this.leftUpHandler = new Cesium.ScreenSpaceEventHandler();
        this.leftUpHandler.setInputAction(
            () => {
                let point; // = undefined, good.
                //noinspection JSUnusedAssignment
                const cartographic = screenToCartographic(viewer, point, true);
                if (this.props.onLeftUp) {
                    this.props.onLeftUp(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_UP
        );

        this.selectedEntityChangeHandler = (selectedEntity: Cesium.Entity | null) => {
            if (this.props.onSelectedEntityChanged) {
                this.props.onSelectedEntityChanged(selectedEntity);
            }
        };
        viewer.selectedEntityChanged.addEventListener(this.selectedEntityChangeHandler);

        if (this.props.onViewerMounted) {
            this.props.onViewerMounted(this.props.id, viewer);
        }
    }

    externalObjectUnmounted(viewer: Cesium.Viewer): void {
        this.mouseClickHandler = this.mouseClickHandler && this.mouseClickHandler.destroy();
        this.mouseClickHandler = null;
        this.mouseMoveHandler = this.mouseMoveHandler && this.mouseMoveHandler.destroy();
        this.mouseMoveHandler = null;
        this.leftUpHandler = this.leftUpHandler && this.leftUpHandler.destroy();
        this.leftUpHandler = null;

        viewer.selectedEntityChanged.removeEventListener(this.selectedEntityChangeHandler);
        this.selectedEntityChangeHandler = null;

        if (this.props.onViewerUnmounted) {
            this.props.onViewerUnmounted(this.props.id, viewer);
        }
    }

    //noinspection JSMethodCanBeStatic
    private updateGlobeSelectedPlacemark(viewer: Cesium.Viewer, selectedPlacemarkId: string | null) {
        const selectedPlacemark = selectedPlacemarkId && viewer.entities.getById(selectedPlacemarkId);
        if (this.props.debug) {
            console.log('CesiumGlobe: updating selected placemark: ', viewer.selectedEntity, selectedPlacemark);
        }
        if (viewer.selectedEntity === selectedPlacemark) {
            return;
        }
        viewer.selectedEntity = selectedPlacemark;
    }

    private updateGlobePlacemarks(viewer: Cesium.Viewer, currentPlacemarks: Placemark[], nextPlacemarks: Placemark[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating placemarks');
        }
        const pinBuilder = new Cesium.PinBuilder();
        const actions = arrayDiff<Placemark>(currentPlacemarks, nextPlacemarks);
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next placemark action', action);
            }
            switch (action.type) {
                case 'ADD': {
                    const placemark = action.newElement;
                    const id = placemark.id;
                    const show = placemark.properties['visible'];
                    const name = placemark.properties['name'] || '';
                    const positionCoords = placemark.geometry.coordinates;
                    const position = new Cesium.Cartesian3.fromDegrees(positionCoords[0], positionCoords[1]);
                    // see http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Map%20Pins.html&label=All
                    const billboard = {
                        image: pinBuilder.fromText(name && name.length ? name[0].toUpperCase() : '?', Cesium.Color.ROYALBLUE, 32).toDataURL(),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    };
                    viewer.entities.add(new Cesium.Entity({
                                                              id,
                                                              name,
                                                              show,
                                                              position,
                                                              billboard,
                                                          }));
                    break;
                }
                case 'REMOVE': {
                    let placemark = action.oldElement;
                    viewer.entities.removeById(placemark.id);
                    break;
                }
                case 'UPDATE':
                    let oldPlacemark = action.oldElement;
                    let newPlacemark = action.newElement;
                    let change = action.change;
                    let entity = viewer.entities.getById(oldPlacemark.id);
                    if (entity) {
                        if (this.props.debug) {
                            console.log('Entity change: ', change, oldPlacemark, newPlacemark);
                        }
                        const show = newPlacemark.properties['visible'];
                        const name = newPlacemark.properties['name'] || '';
                        const positionCoords = newPlacemark.geometry.coordinates;
                        const position = new Cesium.Cartesian3.fromDegrees(positionCoords[0], positionCoords[1]);
                        const billboard = {
                            image: pinBuilder.fromText(name && name.length ? name[0].toUpperCase() : '?', Cesium.Color.ROYALBLUE, 32).toDataURL(),
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        };
                        entity.show = show;
                        entity.name = name;
                        entity.position = position;
                        entity.billboard = billboard;
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled placemark action type "${action.type}"`);
            }
        }
    }

    private updateGlobeLayers(viewer: Cesium.Viewer, currentLayers: ImageLayerDescriptor[], nextLayers: ImageLayerDescriptor[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating layers');
        }
        const actions = arrayDiff<ImageLayerDescriptor>(currentLayers, nextLayers);
        let imageryLayer: Cesium.ImageryLayer;
        let newLayer: ImageLayerDescriptor;
        let oldLayer: ImageLayerDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next layer action', action);
            }
            // cesiumIndex is +1 because of its base layer at cesiumIndex=0
            const cesiumIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    imageryLayer = this.addLayer(viewer, action.newElement, cesiumIndex);
                    // TODO (forman): FIXME! Keep assertion here and below, but they currently fail.
                    //                Possible reason, new globe views may not have their
                    //                'selectedVariable' layer correctly initialized. Same problem in OpenLayersMap!
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    CesiumGlobe.setLayerProps(imageryLayer, action.newElement);
                    break;
                case 'REMOVE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    this.removeLayer(viewer, imageryLayer, cesiumIndex);
                    break;
                case 'UPDATE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    oldLayer = action.oldElement;
                    newLayer = action.newElement;
                    if (oldLayer.imageryProviderOptions.url !== newLayer.imageryProviderOptions.url) {
                        // It is a pitty that Cesium API does not allow for changing the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        this.removeLayer(viewer, imageryLayer, cesiumIndex);
                        imageryLayer = this.addLayer(viewer, newLayer, cesiumIndex);
                        imageryLayer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
                        imageryLayer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
                    }
                    // update imageryLayer
                    CesiumGlobe.setLayerProps(imageryLayer, newLayer);
                    break;
                case 'MOVE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    if (action.numSteps < 0) {
                        for (let i = 0; i < -action.numSteps; i++) {
                            viewer.imageryLayers.lower(imageryLayer);
                        }
                    } else {
                        for (let i = 0; i < action.numSteps; i++) {
                            viewer.imageryLayers.raise(imageryLayer);
                        }
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private updateGlobeDataSources(viewer: Cesium.Viewer, currentLayers: VectorLayerDescriptor[], nextLayers: VectorLayerDescriptor[]) {
        const actions = arrayDiff<VectorLayerDescriptor>(currentLayers, nextLayers);
        let dataSource: Cesium.DataSource;
        let newLayer: VectorLayerDescriptor;
        let oldLayer: VectorLayerDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next data source action', action);
            }
            const index = action.index;
            switch (action.type) {
                case 'ADD':
                    dataSource = this.addDataSource(viewer, action.newElement, index);
                    assert.ok(dataSource);
                    // TODO (nf) #477: apply default styles
                    CesiumGlobe.setDataSourceProps(dataSource, action.newElement);
                    break;
                case 'REMOVE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    viewer.dataSources.remove(dataSource, true);
                    break;
                case 'UPDATE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    oldLayer = action.oldElement;
                    newLayer = action.newElement;
                    if (oldLayer.dataSourceOptions.url !== newLayer.dataSourceOptions.url) {
                        viewer.dataSources.remove(dataSource, true);
                        dataSource = this.addDataSource(viewer, newLayer, index);
                    }

                    const styleDiff = diff(oldLayer, newLayer);
                    console.log("CesiumGlobe: styleDiff =", styleDiff);

                    // update imageryLayer
                    CesiumGlobe.setDataSourceProps(dataSource, newLayer);
                    break;
                case 'MOVE': {
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    this.insertDataSource(viewer, dataSource, index + action.numSteps);
                    break;
                }
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private static updateOverlayHtml(viewer: Cesium.Viewer, prevOverlayHtml: HTMLElement, nextOverlayHtml: HTMLElement) {
        // console.log('updateOverlayHtml', prevOverlayHtml, nextOverlayHtml);
        if (nextOverlayHtml) {
            if (prevOverlayHtml) {
                if (!viewer.container.contains(prevOverlayHtml)) {
                    // TODO (forman): FIXME! Why does this happen?
                    console.warn("CesiumGlobe: previous HTML element is not a child", prevOverlayHtml);
                    return;
                }
                viewer.container.replaceChild(nextOverlayHtml, prevOverlayHtml);
            } else {
                viewer.container.appendChild(nextOverlayHtml);
            }
        } else if (prevOverlayHtml) {
            if (!viewer.container.contains(prevOverlayHtml)) {
                // TODO (forman): FIXME! Why does this happen?
                console.warn("CesiumGlobe: previous HTML element is not a child", prevOverlayHtml);
                return;
            }
            viewer.container.removeChild(prevOverlayHtml);
        }
    }

    private static updateSplitLayers(viewer: Cesium.Viewer, prevSplitLayerIndex: number, nextSplitLayerIndex: number) {
        for (let cesiumIndex = 1; cesiumIndex < viewer.imageryLayers.length; cesiumIndex++) {
            const i = cesiumIndex - 1;
            const layer = viewer.imageryLayers.get(cesiumIndex);
            if (i === prevSplitLayerIndex) {
                layer.splitDirection = Cesium.ImagerySplitDirection.NONE;
            }
            if (i === nextSplitLayerIndex) {
                layer.splitDirection = Cesium.ImagerySplitDirection.LEFT;
            }
        }
    }

    private static getImageryProvider(viewer: Cesium.Viewer, layerDescriptor: ImageLayerDescriptor): Cesium.ImageryProvider {
        if (layerDescriptor.imageryProvider) {
            if (typeof layerDescriptor.imageryProvider === 'function') {
                return layerDescriptor.imageryProvider(viewer, layerDescriptor.imageryProviderOptions);
            } else {
                return layerDescriptor.imageryProvider;
            }
        }
        return null;
    }

    // https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
    private static getDataSource(viewer: Cesium.Viewer, dataSourceDescriptor: VectorLayerDescriptor): Cesium.DataSource {
        if (dataSourceDescriptor.dataSource) {
            if (typeof dataSourceDescriptor.dataSource === 'function') {
                return dataSourceDescriptor.dataSource(viewer, dataSourceDescriptor.dataSourceOptions);
            } else {
                return dataSourceDescriptor.dataSource;
            }
        }
        return null;
    }

    private addDataSource(viewer: Cesium.Viewer, layerDescriptor: VectorLayerDescriptor, layerIndex: number): Cesium.DataSource {
        const dataSource = CesiumGlobe.getDataSource(viewer, layerDescriptor);
        this.insertDataSource(viewer, dataSource, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added data source #${layerIndex}: ${layerDescriptor.name}`);
        }
        return dataSource;
    }

    private insertDataSource(viewer: Cesium.Viewer, dataSource: Cesium.DataSource, index: number) {
        const dataSources: Cesium.DataSource[] = [];
        // Save all data sources from index to end in dataSources
        for (let i = index; i < viewer.dataSources.length; i++) {
            dataSources.push(viewer.dataSources.get(i));
        }
        // Remove them from viewer
        dataSources.forEach(ds => {
            viewer.dataSources.remove(ds, false);
        });
        // Add the new one (at index)
        viewer.dataSources.add(dataSource);
        // Add the removed ones
        dataSources.forEach(ds => {
            if (ds !== dataSource) {
                viewer.dataSources.add(ds);
            }
        });
    }

    private addLayer(viewer: Cesium.Viewer, layerDescriptor: ImageLayerDescriptor, layerIndex: number): Cesium.ImageryLayer {
        const imageryProvider = CesiumGlobe.getImageryProvider(viewer, layerDescriptor);
        const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return imageryLayer;
    }

    private removeLayer(viewer: Cesium.Viewer, imageryLayer: Cesium.ImageryLayer, layerIndex: number): void {
        viewer.imageryLayers.remove(imageryLayer, true);
        if (this.props.debug) {
            console.log(`CesiumGlobe: removed imagery layer #${layerIndex}`);
        }
    }

    private static setLayerProps(imageryLayer: Cesium.ImageryLayer, layerDescriptor: ImageLayerDescriptor) {
        //imageryLayer.name = layerDescriptor.name;
        imageryLayer.show = layerDescriptor.visible;
        imageryLayer.alpha = layerDescriptor.opacity;
        imageryLayer.brightness = layerDescriptor.brightness;
        imageryLayer.contrast = layerDescriptor.contrast;
        imageryLayer.hue = layerDescriptor.hue;
        imageryLayer.saturation = layerDescriptor.saturation;
        imageryLayer.gamma = layerDescriptor.gamma;
        // TODO (mz,nf): set from layerDescriptor.interpolation prop (NEAREST / BILINEAR);
        imageryLayer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
        imageryLayer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
    }

    private static setDataSourceProps(dataSource: Cesium.DataSource
        | Promise<Cesium.DataSource>, dataSourceDescriptor: VectorLayerDescriptor) {
        Promise.resolve(dataSource).then((resolvedDataSource: Cesium.DataSource) => {
            //resolvedDataSource.name = dataSourceDescriptor.name;
            resolvedDataSource.show = dataSourceDescriptor.visible;
        });
    }
}

function screenToCartographic(viewer: Cesium.Viewer, screenPoint?: Cesium.Cartesian2, degrees?: boolean): Cesium.Cartographic {
    let canvasPoint;
    if (screenPoint) {
        const rect = viewer.canvas.getBoundingClientRect();
        const x = screenPoint.x;
        const y = screenPoint.y;
        if ((x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) {
            canvasPoint = new Cesium.Cartesian2(x - rect.left, y - rect.top);
        }
    }
    if (canvasPoint) {
        const ellipsoid = viewer.scene.globe.ellipsoid;
        const cartesian = viewer.camera.pickEllipsoid(canvasPoint, ellipsoid);
        if (cartesian) {
            const cartographic = ellipsoid.cartesianToCartographic(cartesian);
            if (cartographic && degrees) {
                const factor = 10000.;
                const longitude = Math.round(factor * Cesium.Math.toDegrees(cartographic.longitude)) / factor;
                const latitude = Math.round(factor * Cesium.Math.toDegrees(cartographic.latitude)) / factor;
                return {longitude, latitude, height: cartographic.height};
            }
            return cartographic;
        }
    }
}
