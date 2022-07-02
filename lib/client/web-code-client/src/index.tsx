import * as ReactDOM from 'react-dom';
import * as React from 'react';
import './assets/style.scss';

import {App} from './app/App';

window.oncontextmenu = (event) => false //禁用浏览器右键菜单 

ReactDOM.render(
    <App/>,
    document.getElementById('app')
);
