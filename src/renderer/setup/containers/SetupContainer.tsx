import * as React from 'react';
import {connect} from "react-redux";
import {Button, Intent} from "@blueprintjs/core";
import {
SCREEN_ID_CATE_INSTALL, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_TASK_MONITOR, ScreenId,
State
} from "../state";
import * as actions from "../actions";
import {StartScreen} from "./StartScreen";
import {CateInstallScreen} from "./CateInstallScreen";
import {TaskMonitorScreen} from "./TaskMonitorScreen";
import {EndScreen} from "./EndScreen";


interface ISetupContainerProps {
    screenId: ScreenId;
    progress: number | null;
    validations: { [screenId: string]: any };
}

function mapStateToProps(state: State): ISetupContainerProps {
    return {
        screenId: state.screenId,
        progress: state.progress,
        validations: state.validations,
    };
}

interface Screen {
    title: string;
    panel: React.ReactElement<any>;
}

type Screens = { [screenId: string]: Screen };

const SCREENS: Screens = {
    [SCREEN_ID_START]: {
        title: "Additional Setup Required",
        panel: <StartScreen/>,
    },
    [SCREEN_ID_CATE_INSTALL]: {
        title: "Install Cate Python Package",
        panel: <CateInstallScreen/>,
    },
    [SCREEN_ID_TASK_MONITOR]: {
        title: "Run Setup Tasks",
        panel: <TaskMonitorScreen/>,
    },
    [SCREEN_ID_END]: {
        title: "Setup Successful",
        panel: <EndScreen/>,
    },
};

class _SetupContainer extends React.PureComponent<ISetupContainerProps & actions.DispatchProp> {
    static readonly headerHeight = "34px";
    static readonly footerHeight = "52px";
    static readonly middleHeight = `calc(100% - ${_SetupContainer.headerHeight} - ${_SetupContainer.footerHeight})`;

    static readonly headerStyle: React.CSSProperties = {
        fontSize: "1.1em",
        fontWeight: "bold",
        height: _SetupContainer.headerHeight,
        lineHeight: _SetupContainer.headerHeight,
        backgroundColor: "#EEEEEE",
        paddingLeft: 10
    };

    static readonly footerStyle: React.CSSProperties = {
        height: _SetupContainer.footerHeight,
        margin: 0,
        padding: 10,
        display: "flex",
        justifyContent: "flex-end"
    };

    static readonly middleStyle: React.CSSProperties = {
        height: _SetupContainer.middleHeight,
        margin: 0,
        padding: 10
    };

    static readonly containerStyle: React.CSSProperties = {
        height: "100%",
        margin: 0,
        padding: 0
    };

    public render(): React.ReactNode {
        const screen = SCREENS[this.props.screenId];

        let canMoveBack = this.props.progress === null;
        let canMoveForward = (this.props.progress === null || this.props.progress === 1)
                             && !this.props.validations[this.props.screenId];

        let backButton;
        let nextButton;
        let endButton;

        if (this.props.screenId !== SCREEN_ID_START && canMoveBack) {
            backButton = <Button style={{marginLeft: 2, marginRight: 2}}
                                 text="Back"
                                 iconName="arrow-left"
                                 intent={Intent.PRIMARY}
                                 onClick={() => this.props.dispatch(actions.moveBack())}/>;
        }

        if (this.props.screenId === SCREEN_ID_END) {
            endButton = <Button style={{marginLeft: 2}}
                                text="Done"
                                disabled={!canMoveForward}
                                iconName="tick-circle"
                                intent={Intent.PRIMARY}
                                onClick={() => this.props.dispatch(actions.endSetup())}/>;
        } else {
            nextButton = <Button style={{marginLeft: 2}}
                                 text="Next"
                                 disabled={!canMoveForward}
                                 iconName="arrow-right"
                                 intent={Intent.PRIMARY}
                                 onClick={() => this.props.dispatch(actions.moveForward())}/>;
        }

        const cancelButton = <Button style={{marginRight: 24}}
                                     text="Cancel"
                                     onClick={() => this.props.dispatch(actions.cancelSetup())}/>;

        return (
            <div style={_SetupContainer.containerStyle}>
                <div style={_SetupContainer.headerStyle}>{screen.title}</div>
                <div style={_SetupContainer.middleStyle}>{screen.panel}</div>
                <div style={_SetupContainer.footerStyle}>{cancelButton}{backButton}{nextButton}{endButton}</div>
            </div>
        );
    }
}

export const SetupContainer = connect(mapStateToProps)(_SetupContainer);
