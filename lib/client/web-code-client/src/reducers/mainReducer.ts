import { ActionType } from "./actionType";

export function mainReducer(state, action) {
    switch(action.type) {
        case ActionType.CHANGE_CURRENT_FILE:
            return Object.assign({}, state, {currentFile: action.currentFile});
        default:
            return state;    
    }
}