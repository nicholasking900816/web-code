import axios from 'axios/lib/axios';
import { Config } from '../config';


export class Api {
    static getRootDir(project: string) {
        return axios.get(`${Config.SERVER_URL}/project/getDirectories`, {params: {
            project: project
        }})
    }

    static getFile(path: string) {
        return axios.get(`${Config.SERVER_URL}/project/getFile`, {params: {
            path: path,
            timestamp: Date.now()
        }})
    }

    static save(body) {
        return axios.post(`${Config.SERVER_URL}/project/save`, body)
    }

    static play(project) {
        return axios.get(`${Config.SERVER_URL}/project/server`, {params: {
            project: project
        }})
    }

    static createFile(body) {
        return axios.post(`${Config.SERVER_URL}/project/createFile`, body)
    }

    static createDir(body) {
        return axios.post(`${Config.SERVER_URL}/project/createDir`, body)
    }

    static delete(params) {
        return axios.delete(`${Config.SERVER_URL}/project/delete`, {params: params})
    }

    static paste(body) {
        return axios.post(`${Config.SERVER_URL}/project/paste`, body)
    }

    static rename(body) {
        return axios.post(`${Config.SERVER_URL}/project/rename`, body)
    }
}