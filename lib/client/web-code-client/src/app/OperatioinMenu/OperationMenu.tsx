import * as React from 'react';
import './OperationMenu.scss';

export class OperationMenu extends React.Component<any, any, any> {
    constructor(props) {
        super(props)
    }

    gOperationEles() {
        if (!this.props.operations) return [];
        return this.props.operations.map(opt => (
            <li onClick={() => opt.onClick()}>
                <i className={opt.iconClass}></i>
                <span>{opt.name}</span>
                <span className='short-cut'>{opt.shortCut}</span>
            </li>
        ))
    }

    render() {
        return (
            <div className='tran-full-screen-cover operation-menu' 
                onClick={(e) =>{
                    e.stopPropagation();
                    this.props?.onCoverClick()
                }}
                onMouseDown={(e) => {
                    e.stopPropagation()
                }}
                onMouseUp={(e) => {
                    e.stopPropagation()
                }}
            >
                <div className='menu-container' onClick={(e) => {e.stopPropagation()}} style={{
                    left: this.props.menuPosition.left + 'px',
                    top: this.props.menuPosition.top + 'px'
                }}>
                    <ul>
                        {this.gOperationEles()}
                    </ul>
                </div>
            </div>
        )
    }
}