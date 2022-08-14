var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

/* GET home page. */
const multer = require('multer');
let obj = multer({ dest: './public/upload' });

router.use(function(req, res, next) {
  let str = '';
  
  req.on('readable', function(chunk) {
    let data = req.read();
    if (data) {
      str += data.toString();
    }
  })  
  req.on('end', function(chunk) {
    let boundary = /=([a-zA-Z0-9\-]+)$/.exec(req.headers['content-type'])[1];
    let fileDatas = str.split(boundary).slice(1,-1);
    fileDatas.forEach(data => {
      let splitIndex = data.indexOf('\r\n\r\n');
      let header = data.slice(0, splitIndex);
      let content = data.slice(splitIndex + 4, -4);
      let fileName = /filename="(\S+)"/.exec(header)[1];
      fs.writeFileSync(path.resolve(__dirname, `../public/${fileName}`), Buffer.from(content));
    })
    next();
  })
})
// router.use(obj.any());
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/hello', function(req, res) {
  res.send('hello human')
})

router.post('/upload', function(req, res) {
  console.log('hello');
  res.send('hello');
})

module.exports = router;
