var express = require('express');
var app = express();
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var methods = require('./methods');
var models = require('./models/userModel');
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var superagent = require("superagent");
var requst = require('request');
var session = require('express-session');
var url = require('url');
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'max', saveUninitialized: false, resave: false}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));



app.engine('hbs', hbs({extname:'hbs', layoutsDir: __dirname + '/views/pages/'}));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

var token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTk1MjQ3MDU2LCJwaG9uZSI6IjM4NDk0IiwicGFzc3dvcmQiOiIkMmEkMTAkOEo0MGZwVDN1aWhpTFdSdkRlODlnZVZNUHdmdGV6UEtpeWlXcS54dVZBNGluQ3JxUEs5NUsiLCJpc0JvdCI6dHJ1ZSwiY291bnRyeSI6dHJ1ZSwiaWF0IjoxNDk5MDg4OTAxfQ.hXOMugMPiuCU71Kj1JFArCSncEABFJvlgNHSNnjBPIw';
var nambaurl = 'https://api.namba1.co';

// mongoose.connect(uri);

function writeFile(id, text) {
    return fs.appendFileSync('./' + id + 'user.txt', text + '-')
}

function readFile(id){
    return fs.readFileSync('./' + id + 'user.txt', 'utf8')
}

function removeFileContent(id){
    return fs.writeFileSync('./' + id + 'user.txt', '')

}
var redis = require('redis'),
    client = redis.createClient();

app.get('/', function (request, response, next) {
    client.on('error', function (error) {
       console.log(error)
    });
    client.set("string key", "string val", redis.print);
    console.log(client.keys('*', function (error, keys) {
        console.log(keys)
        
    }));
    return response.json({'result': false, error: 'Not post method'})
});

//s
app.post('/', function(request, response) {
    var chat_id = request.body['data']['chat_id'];
    var data = request.body['data'];
    var content = request.body['data']['content'];
    switch (request.body['event']){
        case 'message/new':
            var sender_id = data['sender_id'];
            if(content === 'start'){
                removeFileContent(sender_id);
                methods.sendSms(chat_id, 'Введите id плейлиста в namba для скачивание', function () {
                    writeFile(sender_id, 'wait_id');
                });
            }else if(readFile(sender_id) === 'wait_id-') {
                methods.getPlayList(content).then(function (body) {
                    var tracks = '';
                    for (var id in body['mp3Files']){
                        tracks += (body['mp3Files'][id]['filename'] + '\r\n что бы скачать введите -->' + id + '\r\n')
                    }
                    methods.sendSms(chat_id, tracks,function () {
                    });
                    writeFile(sender_id, 'wait_track');
                    writeFile(sender_id, content);
                }).catch(function (error) {
                    methods.sendSms(chat_id, 'Такой плейлист не был найден выберите другой', function () {

                    })
                });
            }else if (readFile(sender_id).split('-').slice(0, -2).join('-') === 'wait_id-wait_track'){
                methods.getPlayList(readFile(sender_id).split('-').slice(-2)[0]).then(function (body) {
                var coldlink = body['mp3Files'][content]['coldlink'];
                var stream = requst(coldlink).pipe(fs.createWriteStream('./' + user_id + 'user.mp3'));
                setTimeout(function () {
                    methods.sendSms(chat_id, 'Это может занять от 5 секунды до 1 минуты', function () {
                    })
                }, 5000);
                stream.on('finish', function () {
                    superagent.post('https://files.namba1.co')
                        .attach("file", './' + user_id + 'user.mp3').end(function (error, req) {
                        if (!error){
                            methods.sendMusic(chat_id, req.body['file'], function () {
                                methods.sendSms(chat_id, 'Если не воспризводиться мелодия то это скорей всего коряво залитая музыка в nambe', function (body) {

                                })
                                response.end()
                            })
                        }else {
                            console.log(error)
                        }
                    });
                });
                }).catch(function (error) {
                    methods.sendSms(chat_id, 'Такая песня не была найдено в этом плейлисте выберите еще раз', function () {
                    })
                });
            }
            else{
                var text = 'Не правильно веденные данные';
                methods.sendSms(chat_id, text, function () {
                });
            }
        break;
        case 'user/follow':
            var user_id = data['id'];
            methods.createChat(user_id, function (body) {
            methods.sendSms(body['data']['id'], 'Добро пожаловать отправьте start что бы начать', function (body) {
            fs.writeFile('' + user_id + 'user.txt', function (error) {
                    if (error){
                        console.log(error)
                    }
                })
            })
        });
          break;
        case 'user/unfollow':
            var id = data['id'];
            try {
                fs.unlinkSync('' + id + 'user.txt');
                fs.unlinkSync('./' + id + 'user.mp3');
            }
            catch (error){
                console.log(error)
            }
            break;
        default:
            console.log(request.body['event']);
    }
    response.end()
});
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



module.exports.token = token;
module.exports.send_url = nambaurl;

