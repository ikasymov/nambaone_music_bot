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
var client = require('redis').createClient('redis://h:p61654e08cdaf832ac245aa75cd022e91936f9f79ad38a7d7a02ac85e150a7750@ec2-34-230-117-175.compute-1.amazonaws.com:20739');

app.get('/', function (request, response, next) {
    return response.json({'result': false, error: 'Not post method'})
});

function getMusicNameList(body, callback) {
    var tracks = '';
    for (var id in body['mp3Files']){
        tracks += (body['mp3Files'][id]['filename'] + '\r\n что бы скачать введите -->' + id + '\r\n')
    }
    callback(tracks)
}
function writeAndSendMusic(data) {
    return new Promise(function (resolve, rejected) {
        var coldlink = data.body['mp3Files'][data.content]['coldlink'];
        console.log(coldlink)
        var stream = requst(coldlink).pipe(fs.createWriteStream('./' + data.sender_id + 'user.mp3'));

        stream.on('finish', function () {
            setTimeout(function () {
                methods.sendSms(data.chat_id, 'Это может занять от 5 секунды до 1 минуты')
            }, 5000);
            superagent.post('https://files.namba1.co')
                .attach("file", './' + data.sender_id + 'user.mp3').end(function (error, req) {
                if (!error){
                    methods.sendMusic(data.chat_id, req.body['file'])
                        .then(body => {
                            resolve(body)
                        })
                }else {
                    rejected(error)
                }
            });
        });
    });
}

app.post('/', function(request, response) {
    var chat_id = request.body['data']['chat_id'];
    var data = request.body['data'];
    var content = request.body['data']['content'];
    switch (request.body['event']){
        case 'message/new':
            var sender_id = data['sender_id'];

            if(content === 'start') {

                methods.sendSms(chat_id, 'Введите id плейлиста в namba для скачивание')
                    .then(body => {
                        client.set(sender_id, 'wait_id')
                    })
            }else {
                client.get(sender_id, function (error, value) {

                    if (value === 'wait_id'){
                        client.set(sender_id, '');
                        methods.getPlayList(content)
                            .then(function (body) {
                                getMusicNameList(body, function (tracks) {
                                    methods.sendSms(chat_id, tracks);
                                    client.set(sender_id, 'wait_track');
                                    client.set('track_' + sender_id, content)
                                });

                            })
                            .catch(function (error) {
                                console.log(error);
                                methods.sendSms(chat_id, 'Такой плейлист не был найден выберите другой')
                        });

                    }else if(value === 'wait_track'){

                        client.get('track_' + sender_id, function (error, value) {
                            methods.getPlayList(value)
                                .then(function (body) {
                                    let data = {
                                        body: body,
                                        content: content,
                                        sender_id: sender_id,
                                        chat_id: chat_id
                                    };
                                    writeAndSendMusic(data).then(body => {
                                        let sendText = 'Если не воспризводиться мелодия то это скорей всего коряво залитая музыка в nambe';
                                        methods.sendSms(data.chat_id, sendText);
                                    });
                                })
                                .catch(function (error) {
                                    console.log(error);
                                    methods.sendSms(chat_id, 'Такая песня не была найдено в этом плейлисте выберите еще раз');
                                });
                        });

                    }else{
                        let text = 'Не правильно веденные данные';
                        methods.sendSms(chat_id, text);
                    }
                })
            }
        break;

        case 'user/follow':
            let user_id = data['id'];
            methods.createChat(user_id)
                .then(body => {
                    methods.sendSms(user_id, 'Добро пожаловать отправьте start что бы начать');
                });
            break;

        case 'user/unfollow':
            let id = data['id'];
            client.del(id, function (error, value) {
            });
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

