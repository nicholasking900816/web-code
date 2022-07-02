import { Api } from "../api";
import { FileObject } from "../app/DirectoryComponent/File/FileObject";
import { ActionType } from "./actionType";

export function changeSelectedFile(file: FileObject) {
    return function(dispatch) {
        dispatch(ActionType.FETCHING_FILE);
        Api.getFile(file.path).then(res => {
            
        })
    }
}