import {expect} from 'chai';
import {convertLayersToLayerDescriptors} from "./globe-view-layers";

describe('convertLayersToLayerDescriptors', function () {
    it('converts correctly', function () {

        const baseDir = 'hotte';
        const baseUrl = 'http://localhost/';

        let layers, resources, descriptors;

        layers = [
            {
                id: 'countries',
                name: 'Countries',
                type: 'Vector',
                visible: true,
            },
            {
                id: 'L423',
                name: 'I has a bucket',
                type: 'ResourceVector',
                visible: true,
                resName: 'res_1'
            },
            {
                id: 'L427',
                name: 'I love ma bucket',
                type: 'VariableImage',
                visible: true,
                resName: 'res_2',
                varName: 'sst',
            }
        ];
        resources = [
            {
                name: 'res_1'
            },
            {
                name: 'res_2',
                variables: [
                    {
                        name: 'sst',
                        imageLayout: {
                            numLevels: 5,
                            tileWidth: 360,
                            tileHeight: 180,
                            numLevelZeroTilesX: 1,
                            numLevelZeroTilesY: 1,
                            extent: {west: -180., south: -90., east: 180., north: 90.},
                        }
                    }
                ]
            },
        ];

        descriptors = convertLayersToLayerDescriptors([], resources, baseUrl, baseDir);
        expect(descriptors).to.deep.equal({});

        descriptors = convertLayersToLayerDescriptors(layers, resources, baseUrl, baseDir);
        expect(descriptors.vectorLayerDescriptors).to.have.length(2);
        expect(descriptors.imageLayerDescriptors).to.have.length(1);

        const ld1 = descriptors.vectorLayerDescriptors[0];
        const ld2 = descriptors.vectorLayerDescriptors[1];
        const ld3 = descriptors.imageLayerDescriptors[0];

        expect(ld1.id).to.equal("countries");
        expect(ld1.name).to.equal("Countries");
        expect(ld1.visible).to.be.true;
        expect(ld1.dataSource).to.be.a('function');
        expect(ld1.dataSourceOptions).to.deep.equal({url: "http://localhost/ws/countries"});

        expect(ld2.id).to.equal("L423");
        expect(ld2.name).to.equal("I has a bucket");
        expect(ld2.visible).to.be.true;
        expect(ld2.resName).to.equal("res_1");
        expect(ld2.dataSource).to.be.a('function');
        expect(ld2.dataSourceOptions).to.deep.equal({
                                                        name: "res_1",
                                                        url: "http://localhost/ws/res/geojson/hotte/res_1"
                                                    });

        expect(ld3.id).to.equal("L427");
        expect(ld3.name).to.equal("I love ma bucket");
        expect(ld3.visible).to.be.true;
        expect(ld3.type).to.be.equal("VariableImage");
        expect(ld3.resName).to.equal("res_2");
        expect(ld3.varName).to.equal("sst");
        expect(ld3.imageryProvider).to.be.a('function');
        expect(ld3.imageryProviderOptions).to.exist;
        expect(ld3.imageryProviderOptions.minimumLevel).to.equal(0);
        expect(ld3.imageryProviderOptions.maximumLevel).to.equal(4);
        expect(ld3.imageryProviderOptions.tileWidth).to.equal(360);
        expect(ld3.imageryProviderOptions.tileHeight).to.equal(180);
        expect(ld3.imageryProviderOptions.rectangle).to.exist;
        expect(ld3.imageryProviderOptions.rectangle.west).to.equal(-Math.PI);
        expect(ld3.imageryProviderOptions.rectangle.south).to.equal(-Math.PI/2);
        expect(ld3.imageryProviderOptions.rectangle.east).to.equal(Math.PI);
        expect(ld3.imageryProviderOptions.rectangle.north).to.equal(Math.PI/2);
        expect(ld3.imageryProviderOptions.tilingScheme).to.exist;
    });
});