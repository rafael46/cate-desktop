import * as React from 'react'
import { IconName } from "@blueprintjs/icons";

export interface IPanelProps {
    id: string;
    title: string;
    icon: IconName;
    body?: JSX.Element|null;
    position?: "top" | "bottom";
}

/**
 * A Panel is a child element of a PanelContainer.
 *
 * @author Norman Fomferra
 */
export class Panel extends React.PureComponent<IPanelProps, any> {
    constructor(props: IPanelProps) {
        super(props);
    }

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return null;
    }
}

