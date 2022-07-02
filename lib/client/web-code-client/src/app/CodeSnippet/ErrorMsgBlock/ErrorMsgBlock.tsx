import * as React from 'react';
import './ErrorMsgBlock.scss';

export class ErrorMsgBlock extends React.Component<any, any, any> {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className={"error-msg-block" + this.props.className}>
                {this.props.msg}
            </div>
        )
    }
}