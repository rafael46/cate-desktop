import * as React from 'react'
import ReactChild = React.ReactChild;
import {
    Colors,
    Position,
    Tooltip,
    MenuItem,
    MenuDivider,
    Menu,
    PopoverInteractionKind,
    Popover
} from "@blueprintjs/core";
import {Splitter} from "./Splitter";
import ReactElement = React.ReactElement;

export interface PanelContainerLayout {
    horPos: number;
    verPos: number;
}

export interface IPanelContainerProps {
    position?: "left" | "right";
    selectedTopPanelId?: string | null;
    selectedBottomPanelId?: string | null;
    onSelectedTopPanelChange?: (panelId: string | null) => void;
    onSelectedBottomPanelChange?: (panelId: string | null) => void;
    layout: PanelContainerLayout;
    onLayoutChange?: (layout: PanelContainerLayout) => void;
    undockedMode?: boolean;
}

export interface IPanelContainerState {
    selectedTopPanelId: string | null;
    selectedBottomPanelId: string | null;
    layout: PanelContainerLayout;
}

/**
 * A PanelContainer comprises Panels.
 *
 * @author Norman Fomferra
 */
export class PanelContainer extends React.PureComponent<IPanelContainerProps, IPanelContainerState> {

    static readonly PANEL_ICON_SIZE = 20; // ==> because pt-icon-large = 20px
    static readonly PANEL_ICON_PADDING = 8;
    static readonly PANEL_BAR_SIZE = 2 * PanelContainer.PANEL_ICON_PADDING + PanelContainer.PANEL_ICON_SIZE;
    static readonly PANEL_BAR_PADDING = 8;
    static readonly PANEL_PANE_PADDING = 4;
    static readonly PANEL_BODY_PADDING = 2;


    constructor(props: IPanelContainerProps) {
        super(props);
        this.onTopPanelSelected = this.onTopPanelSelected.bind(this);
        this.onBottomPanelSelected = this.onBottomPanelSelected.bind(this);
        this.onTopPanelClose = this.onTopPanelClose.bind(this);
        this.onBottomPanelClose = this.onBottomPanelClose.bind(this);
        this.onVerSplitterPosChange = this.onVerSplitterPosChange.bind(this);
        this.onHorSplitterPosChange = this.onHorSplitterPosChange.bind(this);
        this.state = PanelContainer.mapPropsToState(props);
    }

    componentWillReceiveProps(props: IPanelContainerProps) {
        this.setState(PanelContainer.mapPropsToState(props));
    }

    static mapPropsToState(props: IPanelContainerProps): IPanelContainerState {
        return {
            selectedTopPanelId: props.selectedTopPanelId,
            selectedBottomPanelId: props.selectedBottomPanelId,
            layout: props.layout,
        };
    }

    private onTopPanelSelected(panelId: string) {
        const isCurrent = this.state.selectedTopPanelId === panelId;
        this.setState({selectedTopPanelId: isCurrent ? null : panelId} as any, () => {
            if (this.props.onSelectedTopPanelChange) {
                this.props.onSelectedTopPanelChange(this.state.selectedTopPanelId);
            }
        });
    }

    private onBottomPanelSelected(panelId: string) {
        const isCurrent = this.state.selectedBottomPanelId === panelId;
        this.setState({selectedBottomPanelId: isCurrent ? null : panelId} as any, () => {
            if (this.props.onSelectedBottomPanelChange) {
                this.props.onSelectedBottomPanelChange(this.state.selectedBottomPanelId);
            }
        });
    }

    private onTopPanelClose() {
        this.onTopPanelSelected(null);
    }

    private onBottomPanelClose() {
        this.onBottomPanelSelected(null);
    }

    private onVerSplitterPosChange(delta: number) {
        let verPos = this.state.layout.verPos + delta;
        this.setLayout({...this.state.layout, verPos});
    }

    private onHorSplitterPosChange(delta: number) {
        let horPos = this.state.layout.horPos;
        if ((this.props.position || "left") === "left") {
            horPos += delta;
        } else {
            horPos -= delta;
        }
        this.setLayout({...this.state.layout, horPos});
    }

    private setLayout(layout: PanelContainerLayout) {
        this.setState({layout} as any, () => {
            if (this.props.onLayoutChange) {
                this.props.onLayoutChange(layout);
            }
        });
    }

    private getSelectedTopPanel(): JSX.Element | null {
        return this.findPanel(this.state.selectedTopPanelId);
    }

    private getSelectedBottomPanel(): JSX.Element | null {
        return this.findPanel(this.state.selectedBottomPanelId);
    }

    private findPanel(id: string): JSX.Element | null {
        if (!id) {
            return null;
        }
        let selectedPanel: JSX.Element = null;
        React.Children.forEach(this.props.children, (child: ReactChild) => {
            const panel = child as JSX.Element;
            if (panel.props && panel.props.id === id) {
                selectedPanel = panel;
            }
        });
        return selectedPanel;
    }

    render() {
        const panelBar = <PanelBar panels={React.Children.toArray(this.props.children) as JSX.Element[]}
                                   barSize={PanelContainer.PANEL_BAR_SIZE}
                                   position={this.props.position}
                                   selectedTopPanelId={this.state.selectedTopPanelId}
                                   selectedBottomPanelId={this.state.selectedBottomPanelId}
                                   onTopPanelSelected={this.onTopPanelSelected}
                                   onBottomPanelSelected={this.onBottomPanelSelected}/>;

        const selectedTopPanel = this.getSelectedTopPanel();
        const selectedBottomPanel = this.getSelectedBottomPanel();

        const panelPaneWidth = this.state.layout.horPos;

        let topPanelPane;
        if (selectedTopPanel) {

            let panelPaneHeight;
            if (selectedTopPanel && selectedBottomPanel) {
                panelPaneHeight = this.state.layout.verPos;
            } else {
                panelPaneHeight = "100%";
            }

            const topPanelPaneStyle = {
                width: panelPaneWidth,
                maxWidth: panelPaneWidth,
                height: panelPaneHeight,
                maxHeight: panelPaneHeight,
            };

            topPanelPane = <PanelPane panel={selectedTopPanel}
                                      onClose={this.onTopPanelClose}
                                      position={this.props.position}
                                      style={topPanelPaneStyle}/>;
        }

        let bottomPanelPane;
        if (selectedBottomPanel) {

            let panelPaneHeight;
            if (selectedTopPanel && selectedBottomPanel) {
                // panelPaneHeight remains undefined
            } else {
                panelPaneHeight = "100%";
            }

            const bottomPanelPaneStyle = {
                width: panelPaneWidth,
                maxWidth: panelPaneWidth,
                height: panelPaneHeight,
                maxHeight: panelPaneHeight,
            };

            bottomPanelPane = <PanelPane panel={selectedBottomPanel}
                                         onClose={this.onBottomPanelClose}
                                         position={this.props.position}
                                         style={bottomPanelPaneStyle}/>;
        }

        let panelParent;
        if (topPanelPane && bottomPanelPane) {
            panelParent = this.renderTwoPanelsPane(topPanelPane, bottomPanelPane);
        } else if (topPanelPane) {
            panelParent = topPanelPane;
        } else if (bottomPanelPane) {
            panelParent = bottomPanelPane;
        }

        let panelPane;
        if (panelParent) {
            panelPane = this.renderPanelPane(panelParent);
        }

        const panelContainerStyle = {
            display: "flex",
            flexFlow: "row nowrap",
            flex: "none",
            maxHeight: "100%",
            //opacity: .5,
        };

        const position = this.props.position || "left";
        if (position === "left") {
            return (
                <div style={panelContainerStyle}>
                    {panelBar}
                    {panelPane}
                </div>
            );
        } else {
            return (
                <div style={panelContainerStyle}>
                    {panelPane}
                    {panelBar}
                </div>
            );
        }
    }

    private renderTwoPanelsPane(topPanelPane, bottomPanelPane) {
        const verSplitter = <Splitter dir="ver" onChange={this.onVerSplitterPosChange}/>;
        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                {topPanelPane}
                {verSplitter}
                {bottomPanelPane}
            </div>
        );
    }

    private renderPanelPane(panelParent) {
        const undockedMode = this.props.undockedMode || false;
        const position = this.props.position || "left";

        let undockedModeStyle;
        if (undockedMode) {
            if (position === "left") {
                undockedModeStyle = {
                    position: "absolute",
                    top: 0,
                    left: PanelContainer.PANEL_BAR_SIZE,
                    backgroundColor: PANEL_UNDOCKED_BACKGROUND_COLOR,
                };
            } else {
                undockedModeStyle = {
                    position: "absolute",
                    top: 0,
                    right: PanelContainer.PANEL_BAR_SIZE,
                    backgroundColor: PANEL_UNDOCKED_BACKGROUND_COLOR,
                };
            }
        }

        const panelPaneStyle = {
            paddingTop: PanelContainer.PANEL_PANE_PADDING,
            paddingLeft: position === "left" ? PanelContainer.PANEL_PANE_PADDING : 0,
            paddingRight: position === "left" ? 0 : PanelContainer.PANEL_PANE_PADDING,
            flex: "auto",
            display: "flex",
            flexFlow: "row nowrap",
            zIndex: 5,
            //height: "100%",
            maxHeight: "100%",
            ...undockedModeStyle
        };

        const horSplitter = <Splitter dir="hor" onChange={this.onHorSplitterPosChange}/>;

        if (position === "left") {
            return (
                <div style={panelPaneStyle}>
                    {panelParent}
                    {horSplitter}
                </div>
            );
        } else {
            return (
                <div style={panelPaneStyle}>
                    {horSplitter}
                    {panelParent}
                </div>
            );
        }
    }
}


interface IPanelHeaderProps {
    id: string;
    iconName: string;
    title: string;
    onClose: () => void;
}

function PanelHeader(props: IPanelHeaderProps): JSX.Element | null {
    const panelIcon = <span
        className={"pt-icon-standard " + props.iconName + " cate-panel-header-item"}/>;
    const panelTitle = <span
        className={"cate-panel-text cate-panel-header-item"}>{props.title.toUpperCase()}</span>;

    const panelMenu = (
        <Menu>
            <MenuItem text="Move up"/>
            <MenuItem text="Move down"/>
            <MenuDivider />
            <MenuItem text="Hide"/>
        </Menu>
    );

    const panelMenuIcon = (
        <Popover content={panelMenu} interactionKind={PopoverInteractionKind.CLICK}>
            <span className={"pt-icon-standard pt-icon-properties cate-icon-small cate-panel-header-item"}/>
        </Popover>
    );
    const panelCloseIcon = (
        <span className={"pt-icon-standard pt-icon-cross cate-icon-small cate-panel-header-item"}
              onClick={props.onClose}/>);

    return (
        <div className="cate-panel-header" style={{flex: "none"}}>
            {panelIcon}
            {panelTitle}
            {panelMenuIcon}
            {panelCloseIcon}
        </div>
    );
}

const PANEL_BAR_ITEM_BASE_STYLE = {padding: PanelContainer.PANEL_ICON_PADDING};
const PANEL_BAR_ITEM_NORMAL_STYLE = {...PANEL_BAR_ITEM_BASE_STYLE, color: Colors.GRAY4};
const PANEL_BAR_ITEM_SELECTED_STYLE = {
    ...PANEL_BAR_ITEM_BASE_STYLE,
    color: Colors.WHITE,
    backgroundColor: Colors.DARK_GRAY5
};

// This is Colors.DARK_GRAY5 with 0.5 opacity
const PANEL_UNDOCKED_BACKGROUND_COLOR = "rgba(57, 75, 89, 0.5)";


interface IPanelBarProps {
    panels: JSX.Element[];
    selectedTopPanelId: string | null;
    selectedBottomPanelId: string | null;
    onTopPanelSelected: (panelId: string) => void;
    onBottomPanelSelected: (panelId: string) => void;
    barSize: number;
    position: "left" | "right";
}

function PanelBar(props: IPanelBarProps) {
    const position = props.position || "left";
    const tooltipPos = position === "left" ? Position.RIGHT : Position.LEFT;
    const barSize = props.barSize;
    const panels = props.panels || [];

    function renderPanelButton(panel, selectedPanelId: string) {
        const panelId: string = panel.props.id;
        const panelTitle: string = panel.props.title;
        const panelIconName: string = panel.props.iconName;
        const selected = panelId === selectedPanelId;
        const style = selected ? PANEL_BAR_ITEM_SELECTED_STYLE : PANEL_BAR_ITEM_NORMAL_STYLE;
        const panelPosition: string = panel.props.position || "top";
        const onClick = () => panelPosition === "top" ? props.onTopPanelSelected(panelId) : props.onBottomPanelSelected(panelId);
        return (
            <li key={panelId}
                onClick={onClick}
                style={style}>
                <Tooltip content={panelTitle} position={tooltipPos} hoverOpenDelay={1500}>
                    <span className={"pt-icon-large " + panelIconName}
                          style={{textAlign: "center", verticalAlign: "middle"}}/>
                </Tooltip>
            </li>
        );
    }

    //noinspection JSMismatchedCollectionQueryUpdate
    const topPanelButtons: JSX.Element[] = [];
    //noinspection JSMismatchedCollectionQueryUpdate
    const bottomPanelButtons: JSX.Element[] = [];
    for (let panel of panels) {
        if (!panel.props || !panel.props.id) {
            console.error('PanelBar children must be of type Panel');
            continue;
        }
        const panelPosition: string = panel.props.position || "top";
        if (panelPosition === "top") {
            topPanelButtons.push(renderPanelButton(panel, props.selectedTopPanelId));
        } else {
            bottomPanelButtons.push(renderPanelButton(panel, props.selectedBottomPanelId));
        }
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                flex: "none",
                maxHeight: "100%",
                minWidth: barSize,
                overflow: "hidden",
                backgroundColor: Colors.DARK_GRAY2,
                paddingTop: PanelContainer.PANEL_BAR_PADDING,
                paddingBottom: PanelContainer.PANEL_BAR_PADDING,
            }}>
            <ul style={{flex: "none", listStyleType: "none", padding: 0, margin: 0, border: "none"}}>
                {topPanelButtons}
            </ul>
            <div style={{flex: "auto"}}/>
            <ul style={{flex: "none", listStyleType: "none", padding: 0, margin: 0, border: "none"}}>
                {bottomPanelButtons}
            </ul>
        </div>
    );
}

interface IPanelPaneProps {
    position: "left" | "right";
    style?: {[key:string]: any};
    panel: JSX.Element | null;
    onClose: (panelId: string) => void;
}

function PanelPane(props: IPanelPaneProps) {
    const panel = props.panel;
    if (!panel || !panel.props || !panel.props.body) {
        return null;
    }

    const panelId = panel.props.id;
    const panelBody = panel.props.body;

    let panelParentStyle = {
        //flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        ...props.style,
    };

    const bodyContainerStyle = {
        overflow: "auto",
        //width: "100%",
        flex: "auto",
        padding: PanelContainer.PANEL_BODY_PADDING,
    };

    return (
        <div style={panelParentStyle}>
            <PanelHeader
                id={panelId}
                title={panel.props.title}
                iconName={panel.props.iconName}
                onClose={() => props.onClose(panelId)}
            />
            <div style={bodyContainerStyle}>
                {panelBody}
            </div>
        </div>
    );
}
