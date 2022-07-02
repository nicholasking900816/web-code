import * as React from 'react';
import { MyContext } from '../../myContext';
import { Directory } from './Directory/Directory';
import { FileObject } from './File/FileObject';
import './DirectoryComponent.scss';
import { OperationMenu } from '../OperatioinMenu/OperationMenu';

export class DirectoryComponent extends React.Component<any, any, any> {
    inputRef: any = React.createRef();
    inputRef2: any = React.createRef();
    id: string = null;
    askForNameResolveFn = null;
    rightClickItem: FileObject | Directory = null;
    rightClickDirectory: Directory = null;
    tobeRenamedItem: Directory | FileObject;
    unFoldItemMap: Map<string, boolean> = new Map()
    clipbord: {item: FileObject | Directory, isCut: boolean} = null;
    operations = []
    constructor(props) {
        super(props);
        this.state = {
            rootDirectory: new Directory('', '', null, []),
            selected: null,
            isNameInputBoxVisible: false,
            isNameInputBox2Visible: false,
            menuPosition: {
                left: 0,
                top: 0
            },
            isMenuVisible: false
        }
    }

    onDirectoryNameClick(dir: Directory, e: any) {
        this.unFoldItemMap.set(dir.path, !this.unFoldItemMap.get(dir.path))
        this.context.store.currentDir = dir;
        this.setState({selected: dir.path})
    }

    onCreateFile() {
        let currentDir = this.rightClickDirectory || this.context.store.currentDir;
        this.setState({
            isMenuVisible: false
        })
        this.askForName().then(name => {
            this.closeMenuPanel();
            let path = `${currentDir.path}/${name}`;
            this.context.functions.showSideBarLoading();
            this.context.api.createFile({path: path}).then(res => {
                this.context.functions.hideSideBarLoading();
                if (res.data.status === 200) {
                    this.updateCurrentFileAndDirRef(path).then(res => {
                    if (res.status === 200) {
                        this.context.events.refresh.next(this.context.store.currentFile);
                    }
                })
            }
            }).catch(err => this.context.functions.hideSideBarLoading())
        })

    }

    onCreateDir() {
        let currentDir = this.rightClickDirectory || this.context.store.currentDir;
        this.setState({
            isMenuVisible: false
        })
        this.askForName().then((name: string) => {
            this.closeMenuPanel();
            let path = `${currentDir.path}/${name}`;
            this.context.functions.showSideBarLoading();
            this.context.api.createDir({path: path}).then(res => {
                this.context.functions.hideSideBarLoading();
                if (res.data.status === 200) {
                    this.updateCurrentFileAndDirRef(
                        currentDir.path
                    ).then(() => {
                        this.setState({selected: path});
                    });
                }

            }).catch(err => {
                this.context.functions.hideSideBarLoading();
            })
        })
        this.context.events.askForName.next();
    }

    onDelete(item?: FileObject | Directory) {
        let rightClickItem = item || this.rightClickItem;
        this.closeMenuPanel();
        this.context.api.delete({
            path: rightClickItem.path
        }).then(res => {
            if (res.data.status === 200) {
                this.updateCurrentFileAndDirRef(
                    this.context.store.currentFile && this.context.store.currentFile.path !== rightClickItem.path ? 
                    this.context.store.currentFile.path : this.context.store.currentDir.path
                );
            }
        })
    }

    onCopy() {
        this.clipbord = {
            item: this.rightClickItem,
            isCut: false
        }
        this.closeMenuPanel()
    }

    onPaste() {
        let target = `${this.rightClickDirectory.path}/${this.clipbord.item.name}`;
        this.context.api.paste({
            origin: this.clipbord.item.path,
            target: target
        }).then(res => {
            if (res.data.status === 200 && this.clipbord.isCut) {
                return this.context.api.delete({path: this.clipbord.item.path})
            }
            return res;
        }).then(res => {
            if (res.data.status === 200) {
                if (this.clipbord.item instanceof FileObject) {
                    this.updateCurrentFileAndDirRef(target).then(res => {
                        if (res.status === 200) {
                            this.context.events.refresh.next(this.context.store.currentFile);
                        }
                    })
                } else {
                    this.updateCurrentFileAndDirRef(this.rightClickDirectory.path).then(res => {
                        if (res.status === 200) {
                            this.setState({
                                selected: target
                            })
                        }
                    })
                }
            }
            if (this.clipbord.isCut) this.clipbord = null;
            this.closeMenuPanel();
        })
    }

    onCut() {
        this.clipbord = {
            item: this.rightClickItem,
            isCut: true
        }
        this.closeMenuPanel();
    }

    onRename() {
        this.tobeRenamedItem = this.rightClickItem;
        this.askForName2().then(name => {
            let target = `${this.tobeRenamedItem.parent.path}/${name}`;
            this.context.api.rename({
                origin: this.tobeRenamedItem.path,
                target: target

            }).then(res => {
                if (res.data.status === 200) {
                    if (this.tobeRenamedItem.path === this.context.store.currentFile?.path) {
                        this.updateCurrentFileAndDirRef(target)
                    } else {
                        this.updateCurrentFileAndDirRef(this.context.store.currentFile?.path || this.context.store.currentDir.path)
                    }
                }
            })
        })
    }

    updateCurrentFileAndDirRef(path) {
        return this.context.functions.refreshDir().then(res => {
            if (res.data.status === 200) {
                this.context.functions.updateCurrentFileAndDirRef(path);
                if (this.context.store.currentDir) {
                    this.unFoldItemMap.set(this.context.store.currentDir.path, true);
                }
                this.setState({
                    rootDirectory: this.context.store.rootDir,
                    selected: path,
                    isNameInputBoxVisible: false
                });
            } 
            return res
        })
    }

    askForName() {
        return new Promise((resolve) => {
            this.askForNameResolveFn = resolve;
            this.unFoldItemMap.set((this.rightClickDirectory || this.context.store.currentDir).path, true);
            this.setState({
                isNameInputBoxVisible: true
            }, () => {
                this.inputRef.current.focus();
            })
        })
    }

    askForName2() {
        return new Promise(resolve => {
            this.askForNameResolveFn = resolve;
            this.setState({
                isNameInputBox2Visible: true
            }, () => {
                this.inputRef2.current.focus();
                this.inputRef2.current.value = this.rightClickItem.name;
                this.closeMenuPanel()
            })
        })
    }

    onMouseUp(e, item: FileObject | Directory) {
        if (e.button === 2) {
            e.preventDefault();
            this.rightClickItem = item;
            if (this.rightClickItem instanceof Directory) {
                this.rightClickDirectory = this.rightClickItem;
            } else {
                this.rightClickDirectory = this.rightClickItem.parent;
            }
            this.setState({
                isMenuVisible: true,
                menuPosition: {
                    left: e.clientX + 10,
                    top: e.clientY + 10
                }
            })
        }
    }

    gDirectoryTemplate(directory: Directory) {
        return (
            <div className='directory-item'>
                <div className='directory-name' onClick={(e) => this.onDirectoryNameClick(directory, e)} onMouseUp={(e) => this.onMouseUp(e, directory)}>
                    <div className={['bg-bar', this.state.selected === directory.path ? 'selected' : ''].join(' ')}></div>
                    <div className='content-wrapper'>
                        <i className={['fa-solid icon',this.unFoldItemMap.get(directory.path) ? 'fa-angle-down' : 'fa-angle-right'].join(' ')}></i>         
                        {
                            this.state.isNameInputBox2Visible && 
                            this.tobeRenamedItem.path === directory.path && 
                            (<input type="text" ref={this.inputRef2} onBlur={this.onBlur.bind(this)} className='input-file-dir-name' />) ||
                            <span>{directory.name}</span>
                        }
                    </div>
                    
                </div>
                <div className={['directory-children', this.unFoldItemMap.get(directory.path) ? '' : 'hidden'].join(' ')}>
                    {   this.state.isNameInputBoxVisible && 
                        (this.rightClickDirectory === directory || this.context.store.currentDir === directory) && (
                        <div className='input-wrapper'>
                            <input type="text" ref={this.inputRef} onBlur={this.onBlur.bind(this)} className='input-file-dir-name' />
                        </div>
                    ) }
                    
                    {directory.children.map(child => {
                        if (child instanceof FileObject) {
                            return this.gFileTemplate(child as FileObject)
                        } else if (child instanceof Directory) {
                            return this.gDirectoryTemplate(child as Directory)
                        }
                    })}
                </div>
            </div>
        )
    }

    onMenuCoverClick() {
       this.closeMenuPanel();
    }

    closeMenuPanel() {
        this.setState({
            isMenuVisible: false
        })
        this.rightClickDirectory = this.rightClickItem = null;
    }

    onFileClick(file: FileObject) {
        this.context.store.currentFile = file;
        this.context.store.currentDir = file.parent;
        this.context.events.currentFileChange.next(file);
        this.setState({selected: file.path})
    }

    gFileTemplate(file: FileObject) {
        return (
            <div className='file-item' onClick={()=>{this.onFileClick(file)}} onMouseUp={(e) => this.onMouseUp(e, file)}>
                <div className={['bg-bar', this.state.selected === file.path ? 'selected' : ''].join(' ')}></div>
                <div className='content-wrapper'>
                    <i className='fa-solid fa-file icon'></i>
                    {
                        this.state.isNameInputBox2Visible && 
                        this.tobeRenamedItem.path === file.path && 
                        (<input type="text" ref={this.inputRef2} onBlur={this.onBlur.bind(this)} className='input-file-dir-name' />) ||
                        <span>{file.name}</span>
                    }
                </div>
            </div>
        )
    }

    onBlur(e) {
        this.askForNameResolveFn(e.target.value);
    }

    componentDidMount() {
        this.operations = [
            {
                name: '创建文件',
                iconClass: 'fa-solid fa-file-circle-plus',
                shortCut: '',
                onClick: this.onCreateFile.bind(this)
            },
            {
                name: '创建文件夹',
                iconClass: 'fa-solid fa-folder-plus',
                onClick: this.onCreateDir.bind(this)
            },
            {
                name: '复制',
                shortCut: 'Ctrl + C',
                iconClass: 'fa-solid fa-copy',
                onClick: this.onCopy.bind(this)
            },
            {
                name: '剪切',
                iconClass: 'fa-solid fa-scissors',
                shortCut: 'Ctrl + X',
                onClick: this.onCut.bind(this)
            },
            {
                name: '粘贴',
                iconClass: 'fa-solid fa-paste',
                shortCut: 'Ctrl + V',
                onClick: this.onPaste.bind(this)
            },
            {
                name: '重命名',
                iconClass: 'fa-solid fa-file-pen',
                onClick: this.onRename.bind(this)
            },
            {
                name: '删除',
                iconClass: 'fa-solid fa-trash-can',
                onClick: this.onDelete.bind(this)
            },
        ]
        this.context.functions.refreshDir().then(res => {
            if (res.data.status === 200) {
                this.setState({
                    rootDirectory: Directory.fromServerData(res.data.data),
                });
            }
        })
    }

    render() {
        return (
            <div className='direcory-component'>
                {this.gDirectoryTemplate(this.state.rootDirectory)}
                {this.state.isMenuVisible && (
                    <OperationMenu 
                        menuPosition={this.state.menuPosition}
                        operations={this.operations}
                        onCoverClick={this.closeMenuPanel.bind(this)}
                    ></OperationMenu>
                )}
            </div>
        )
    }
}
DirectoryComponent.contextType = MyContext;