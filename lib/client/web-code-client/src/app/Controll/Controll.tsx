import * as React from 'react';
import { MyContext } from '../../myContext';
import { FileObject } from '../DirectoryComponent/File/FileObject';
import './ControllBar.scss'

export class ControllBar extends React.Component<any, any, any> {
    constructor(props) {
        super(props);
        this.state = {
            onSaveBtnText: '保存(ctrl+s)'
        }
    }

    onSave() {
        let curFile: FileObject = this.context.store.currentFile;
        if (!curFile) return;
        this.setState({onSaveBtnText: '保存中...'})
        curFile.stringifyAsyn().then(content => {
            return this.context.api.save({
                path: curFile.path,
                content: content
            })
        }).then(res => {
            if (res.data.status === 200) {
                this.setState({onSaveBtnText: '保存(ctrl+s)'})
            }
        })
    }

    onPlay() {
        this.context.api.play('project1').then(res => {
            if (res.data.status === 200) {
                window.open(res.data.data);
            }
        })
    }
    
    search() {
        this.context.events.search.next();
    }

    onReresh() {
        if (!this.context.store.currentFile) {
            return;
        }
        this.context.events.refresh.next(this.context.store.currentFile);
    }

    render() {
        return (
            <div className='controll-bar'>
                <button className='controll-btn' onClick={this.onSave.bind(this)}>
                    <i className='fa-solid fa-save'></i>
                    <span>{this.state.onSaveBtnText}</span>
                </button>
                {/* <button className='controll-btn' onClick={this.onPlay.bind(this)}>
                    <i className='fa-solid fa-play'></i>
                    <span>运行(ctrl+w)</span>
                </button> */}
                <button className='controll-btn' onClick={this.onReresh.bind(this)}>
                    <i className='fa-solid fa-refresh'></i>
                    <span>刷新(ctrl+r)</span>
                </button>
                <button className='controll-btn' onClick={this.search.bind(this)}>
                    <i className='fa-solid fa-search'></i>
                    <span>搜索(ctrl+f)</span>
                </button>
            </div>
        )
    }
}
ControllBar.contextType = MyContext;