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
var search_namba = 'http://namba.kg/api/?service=home&action=search&token=scDGbhUjLt1lk6Ii&type=playlists&query=';
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
function searchPlaylist(content) {
    return new Promise(function (resolve, rejected) {
        requst({
            method: 'GET',
            url: search_namba + content,
            json: true
        }, function (error, req, body) {
            if (body.playlists.length <= 0){
                rejected()
            }
            resolve(body.playlists)
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
                client.set(sender_id, '');
                methods.sendSms(chat_id, 'Введите название плейлиста в namba для скачивание')
                    .then(body => {
                        client.set(sender_id, 'wait_id')
                    })
            }else {
                client.get(sender_id, function (error, value) {
                    console.log(value)
                    if (value === 'wait_id'){
                        searchPlaylist(content)
                            .then((list) => {
                                let playlists = '';
                                for (let tracks in list){
                                    playlists += list[tracks]['name'] + '\r\n что бы перейти введите -->' + tracks + '\r\n'
                                }
                                methods.sendSms(chat_id, playlists);
                                client.set(sender_id, 'wait_playlist');
                                client.set('playlist_' + sender_id, content)
                            })
                            .catch(() => {
                                methods.sendSms(chat_id, 'Не было найдено таких плейлистов')
                            })
                    }else if (value === 'wait_playlist'){
                        client.get('playlist_' + sender_id, function (error, value) {
                            console.log(value)
                            searchPlaylist(value)
                                .then((list) => {
                                    // var playlist_id = list[content]['id'] || false;
                                    var newContent = parseInt(content);
                                    if (newContent<= list.length - 1 && typeof !newContent === 'string'){
                                        methods.getPlayList(list[content]['id'])
                                            .then(function (body) {
                                                getMusicNameList(body, function (tracks) {
                                                    methods.sendSms(chat_id, tracks);
                                                    client.set(sender_id, 'wait_track');
                                                    client.set('track_' + sender_id, list[content]['id'])

                                                });

                                            })
                                            .catch(function (error) {
                                                console.log(error);
                                                methods.sendSms(chat_id, 'Такой плейлист не был найден выберите другой')
                                            });
                                    }else {
                                        methods.sendSms(chat_id, 'Такой плейлист не был найден выберите другой')
                                    }
                                });

                        });

                    }
                    else if(value === 'wait_track'){
                        client.get('track_' + sender_id, function (error, value) {
                            methods.getPlayList(value)
                                .then(function (body) {
                                    var coldlink = body['mp3Files'][content]['coldlink'];
                                    var stream = requst(coldlink).pipe(fs.createWriteStream('./' + sender_id + 'user.mp3'));
                                    setTimeout(function () {
                                        methods.sendSms(chat_id, 'Это может занять от 5 секунды до 1 минуты')
                                    }, 5000);
                                    stream.on('finish', function () {
                                        superagent.post('https://files.namba1.co')
                                            .attach("file", './' + sender_id + 'user.mp3').end(function (error, req) {
                                            if (!error){
                                                methods.sendMusic(chat_id, req.body['file'])
                                                    .then(body => {
                                                        client.set(sender_id, '');
                                                        fs.unlink('./' + sender_id + 'user.mp3');
                                                        let sendText = 'Если не воспризводиться мелодия то это скорей всего коряво залитая музыка в nambe, для поиска новой песни введите start';
                                                        methods.sendSms(chat_id, sendText);
                                                    })
                                            }else {
                                                console.log(error)
                                            }
                                        });
                                    });
                                })
                                .catch(function (error) {
                                    console.log(error);
                                    methods.sendSms(chat_id, 'Такая песня не была найдено введи правильный номер песни, либо начните с начала отправив start');
                                });
                        });

                    }else{
                        client.set(sender_id, '');
                        let text = 'Не правильно веденные данные введите start';
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

