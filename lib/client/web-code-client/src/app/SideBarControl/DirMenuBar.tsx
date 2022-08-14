import * as React from 'react';
import { MyContext } from '../../myContext';
import './DirMenuBar.scss';

export class SideBarControl extends React.Component<any, any, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className='side-bar-control'>
                <button className='controll-btn' onClick={this.props.onCreateFile()}>
                    <i className="fa-solid fa-file-circle-plus"></i>
                </button>
                <button className='controll-btn' onClick={this.props.onCreateDir()}>
                    <i className="fa-solid fa-folder-plus"></i>
                </button>
            </div>
        )
    }
}
SideBarControl.contextType = MyContext;
