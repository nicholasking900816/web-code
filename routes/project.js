const express = require('express');
const { route } = require('express/lib/application');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

function gSendData(directoryName, prefix) {
    const dirPath = path.resolve(__dirname, `../projects/${prefix}${directoryName}`);
    let data = {
        type: 'directory',
        path: `${prefix}${directoryName}`,
        name: directoryName,
        children: []
    }
    return fs.readdir(dirPath).then(result => {
        return Promise.all(
            result.map((item, index) => {
                let p = `${dirPath}/${item}`
                return fs.stat(p).then(stat => {
                    if (stat.isFile()) {
                        data.children.push({
                            path: `${prefix}${directoryName}/${item}`,
                            name: item,
                            sortIndex: index,
                            type: 'file'
                        });
                    } else if (stat.isDirectory() && directoryName !== 'node_modules') {
                        return gSendData(item, `${prefix}${directoryName}/`).then(dirData => {
                            dirData.sortIndex = index;
                            data.children.push(dirData)
                        });
                    }
                })
            })
        ).then(() => data)
    })
}

router.get('/getDirectories', function(req, res) {
    gSendData(req.query.project, '').then((data) => {
        res.send(JSON.stringify({
            status: 200,
            data: data,
            msg: 'Success'
        }))
    })
})

router.get('/getFile', function(req, res) {
    fs.readFile(path.resolve(__dirname, `../projects/${req.query.path}`)).then(result => {
        let data = result.toString();
        res.send({
            status: 200,
            data: data,
            msg: 'Success'
        })
    })
})

router.post('/save', function(req, res) {
    fs.writeFile(path.resolve(__dirname, `../projects/${req.body.path}`), req.body.content).then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    })
})

router.post('/createFile', function(req, res) {
    fs.writeFile(path.join(config.projectPath, req.body.path), '').then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    }).catch(err => {})
})

router.post('/createDir', function(req, res) {
    fs.mkdir(path.join(config.projectPath, req.body.path)).then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    }).catch(err => {})
})

router.delete('/delete', function(req, res) {
    fs.rm(path.join(config.projectPath, req.query.path), {
        recursive: true
    }).then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    }).catch(err => {})
})

router.post('/paste', function(req, res) {
    fs.cp(
        path.join(config.projectPath, req.body.origin), 
        path.join(config.projectPath, req.body.target),
        {
            recursive: true
        }
    ).then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    })
})

router.post('/rename', function(req, res) {
    fs.rename(
        path.join(config.projectPath, req.body.origin), 
        path.join(config.projectPath, req.body.target)
    ).then(err => {
        if (!err) {
            res.send({
                status: 200,
                data: null,
                msg: 'Success'
            })
        }
    })
})

router.get('/server', require('../middleware/projectServeMiddleware/index'));

module.exports = router;