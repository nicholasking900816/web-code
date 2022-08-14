import * as React from 'react';
import { CodeSnippet } from './CodeSnippet/CodeSnippet';

import { MyContext } from '../myContext';
import { DirectoryComponent } from './DirectoryComponent/DirectoryComponent';
import './App.scss';
import { Subject } from 'rxjs';
import { Api } from '../api';
import { ControllBar } from './Controll/Controll';
import { Directory } from './DirectoryComponent/Directory/Directory';

const store = {
    currentFile: null,
    currentDir: null,
    rootDir: null
}
const events = {
    currentFileChange: new Subject(),
    refresh: new Subject(),
    search: new Subject(),
    updateCurrentFileAndDirRef: new Subject(),
    refreshDir: new Subject(),
    askForName: new Subject(),
    emitName: new Subject(),
    setSelectedState: new Subject(),
    action: new Subject()
}
const contextValue: any = {
    store: store,
    events: events,
    functions: {
        refreshDir() {
            return Api.getRootDir('project1').then(res => {
                if (res.data.status === 200) {
                    store.rootDir = Directory.fromServerData(res.data.data);
                }
                return res;
            })
        },
        updateCurrentFileAndDirRef(path) {
            function doUpdate(children) {
                children.find(child => {
                    if (child.path === path) {
                        if (child instanceof Directory) {
                            store.currentDir = child;
                            store.currentFile = null;
                        } else {
                            store.currentFile = child;
                            store.currentDir = child.parent;
                        }
                        return true;
                    } else if (child.children && child.children.length) {
                        doUpdate(child.children)
                    }
                })
            }
            if (store.rootDir?.path === path) {
                store.currentDir = store.rootDir;
                store.currentFile = null;
            } else if (store.rootDir?.children) {
                doUpdate(store.rootDir.children);
            }   
        }
    },
    api: Api
};

export class App extends React.Component<any, any, any> {
    constructor(props) {
        super(props);
        this.state = {code: null, showSideBarLoading: false}
    }

    componentDidMount() {
       this.registerSideBarLoading();
    }

    registerSideBarLoading() {
        let timeoutId; 
        contextValue.functions.showSideBarLoading = (delay = 200) => {
            timeoutId = setTimeout(() => {
                this.setState({showSideBarLoading: true})
            }, delay)
        }

        contextValue.functions.hideSideBarLoading = () => {
            if (timeoutId) clearTimeout(timeoutId);
            this.setState({showSideBarLoading: false})
        }
    }

    render() {
        return (
            <MyContext.Provider value={contextValue}>
                <div className="app full-screen">
                    <div className='side-bar'>
                        <div className='directory-container'>
                            <DirectoryComponent></DirectoryComponent>
                        </div>
                        {this.state.showSideBarLoading && (<div className='loading-cover'></div>)}
                    </div>
                    <div className='code-snippet-container'>
                        <div className='controll-bar-wrapper'>
                            <ControllBar></ControllBar>
                        </div>
                        <div className='snippet-wrapper'>
                            <CodeSnippet></CodeSnippet>
                        </div>
                    </div>
                    
                </div>
            </MyContext.Provider>
            
        )
    }
}

App.contextType = MyContext;