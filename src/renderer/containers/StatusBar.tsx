import * as React from "react";
import {connect} from "react-redux";
import {GeographicPosition, State, TaskState} from "../state";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Classes, Intent, Popover, PopoverInteractionKind, Position, Spinner, Tooltip} from "@blueprintjs/core";
import {JobStatusEnum} from "../webapi/Job";
import {TaskComponent} from "./TaskComponent";
import {ListBox} from "../components/ListBox";

interface IStatusBarProps {
    webAPIStatus: 'connecting' | 'open' | 'error' | 'closed' | null;
    tasks: { [jobId: number]: TaskState };
    globePosition: GeographicPosition|null;
}

interface IStatusBarDispatch {
    cancelJob(number): void;
    removeJob(number): void;
}

function mapStateToProps(state: State): IStatusBarProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
        tasks: state.communication.tasks,
        globePosition: selectors.globeMousePositionSelector(state) || selectors.globeViewPositionSelector(state),
    };
}

const mapDispatchToProps = {
    cancelJob: actions.cancelJob,
    removeJob: actions.removeTaskState
};

/**
 * The TasksPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class StatusBar extends React.Component<IStatusBarProps & IStatusBarDispatch, null> {

    static readonly DIV_STYLE = {
        flex: "none",
        display: "flex",
        flexFlow: "row nowrap",
        height: "1.5em",
        fontSize: "small",
        backgroundColor: "#2B95D6",
        overflow: "hidden",
    };

    constructor(props: IStatusBarProps) {
        super(props);
    }

    private renderTasks() {
        let numRunningTasks = 0;
        let numFailedTasks = 0;
        const visibleTaskIds: string[] = [];
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status === JobStatusEnum.SUBMITTED || task.status === JobStatusEnum.IN_PROGRESS) {
                numRunningTasks++;
                visibleTaskIds.push(taskId);
            } else if (task.status === JobStatusEnum.CANCELLED || task.status === JobStatusEnum.FAILED) {
                numFailedTasks++;
                visibleTaskIds.push(taskId);
            }
        }
        const renderItem = (jobId: number, itemIndex: number) => <TaskComponent
            jobId={jobId}
            task={this.props.tasks[jobId]}
            onRemoveJob={this.props.removeJob}
            onCancelJob={this.props.cancelJob}
        />;

        if (visibleTaskIds.length > 0) {
            let msg;
            let spinner = null;
            if (numRunningTasks > 0 && numFailedTasks > 0) {
                msg = `${numRunningTasks} running / ${numFailedTasks} failed task(s)`;
            } else if (numRunningTasks > 0) {
                msg = `${numRunningTasks} running task(s)`;
            } else if (numFailedTasks > 0) {
                msg = `${numFailedTasks} failed task(s)`;
            }
            if (numRunningTasks > 0) {
                spinner = <div style={{
                    display: "flex",
                    flexFlow: "column",
                    justifyContent: "center",
                    width: "1.5em",
                    height: "1.5em"
                }}>
                    <Spinner className={Classes.SMALL} intent={Intent.SUCCESS}/>
                </div>;
            }
            const tasksInPopover = <ListBox style={{width: "300px"}} items={visibleTaskIds} renderItem={renderItem}/>;
            return <Popover
                content={tasksInPopover}
                position={Position.TOP}
                interactionKind={PopoverInteractionKind.HOVER}>
                <div style={{display: "flex", flexFlow: "row nowrap"}}>
                    {spinner}
                    <div style={{display: "flex", flexFlow: "column", justifyContent: "center", paddingLeft: "5px"}}>
                        {msg}
                    </div>
                </div>
            </Popover>;
        } else {
            return null;
        }
    }

    private renderBackendStatus() {
        let iconName = null;
        let tooltipText = null;
        if (this.props.webAPIStatus === 'connecting') {
            iconName = "pt-icon-link";
            tooltipText = "Connecting";
        } else if (this.props.webAPIStatus === 'open') {
            iconName = "pt-icon-link";
            tooltipText = "Connected";
        } else if (this.props.webAPIStatus === 'error') {
            iconName = "pt-icon-offline";
            tooltipText = "Error";
        } else if (this.props.webAPIStatus === 'closed') {
            iconName = "pt-icon-offline";
            tooltipText = "Closed";
        } else {
            iconName = "pt-icon-help";
            tooltipText = "Unknown";
        }
        return <Tooltip content={tooltipText} hoverOpenDelay={1500} position={Position.LEFT_TOP}>
            <span className={`pt-icon-small ${iconName}` }/>
        </Tooltip>;
    };

    render() {
        // TODO dummy
        const message = "Ready.";

        let cursor;
        let position = this.props.globePosition;
        if (position) {
            cursor = `lon=${position.longitude.toFixed(2)}, lat=${position.latitude.toFixed(2)}`
        } else {
            cursor = '';
        }

        return (
            <div style={StatusBar.DIV_STYLE}>
                <div style={{flex: "60 1 auto", padding: 2}}>{message}</div>
                <div style={{flex: "20 1 auto", padding: 2}}>{this.renderTasks()}</div>
                <div style={{flex: "20 1 auto", padding: 1}}>{cursor}</div>
                <div style={{
                    flex: "0 1 auto",
                    padding: 2
                }}>{this.renderBackendStatus()}</div>
            </div>
        );
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);
