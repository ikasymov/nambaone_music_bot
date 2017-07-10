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
var client = require('redis').createClient('redis://h:p61654e08cdaf832ac245aa75cd022e91936f9f79ad38a7d7a02ac85e150a7750@ec2-34-230-117-175.compute-1.amazonaws.com:20739');

app.get('/', function (request, response, next) {
    // client.on('error', function (error) {
    //    console.log(error)
    // });
    //
    // client.set('users_id', 'VALUE');
    // console.log(client.get('users_id').query);

    // client.del('users_id', function (error, value) {
    //     console.log(value)
    // });
    // client.mget('users_id', function (error, value) {
    //     console.log(value)
    // })
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
            if(content === 'start') {
                methods.sendSms(chat_id, 'Введите id плейлиста в namba для скачивание', function () {
                    client.set(user_id, 'wait_id', function (error, value) {
                    })
                });
            }else {
                client.get(user_id, function (error, value) {
                    if (value === 'wait_id'){
                        methods.getPlayList(content).then(function (body) {
                            var tracks = '';
                            for (var id in body['mp3Files']){
                                tracks += (body['mp3Files'][id]['filename'] + '\r\n что бы скачать введите -->' + id + '\r\n')
                            }
                            methods.sendSms(chat_id, tracks,function () {
                            });

                            client.set(user_id, 'wait_track', function (error, value) {
                            });
                            client.set('track_' + user_id, content)
                        }).catch(function (error) {
                            methods.sendSms(chat_id, 'Такой плейлист не был найден выберите другой', function () {

                            })
                        });
                    }else if(value === 'wait_track'){
                        client.get('track_' + user_id, function (error, value) {
                            methods.getPlayList(value).then(function (body) {
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
                        });

                    }else{
                        var text = 'Не правильно веденные данные';
                        methods.sendSms(chat_id, text, function () {
                        });
                    }
                })
            }
        break;
        case 'user/follow':
            var user_id = data['id'];
            methods.createChat(user_id, function (body) {
                methods.sendSms(body['data']['id'], 'Добро пожаловать отправьте start что бы начать', function (body) {
                })
            });
          break;
        case 'user/unfollow':
            var id = data['id'];
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

