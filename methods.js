var request = require('request');
var index = require('./index');
var fs = require('fs');
var nambamusik = 'http://namba.kg/api/?service=music&action=playlist_page&token=35ffJXTW3oSmvWOR&id=';

// 'type': 'audio/mp4',
//     'media/image'
module.exports.sendSms = function (chat_id, text) {
    return new Promise(function (resolve, rejected) {
        let url = index.send_url + '/chats/' + chat_id + '/write';
        let data = {
            url: url,
            method: 'POST',
            body: {
                'type': 'text/plain',
                'content': text
            },
            headers: {
                'X-Namba-Auth-Token': index.token
            },
            json: true
        };

        request(data, function (error, res, body) {
            if (error){
                rejected(error)
            }
            resolve(body)
        });


    })


    };

module.exports.sendMusic = function (chat_id, file) {
    return new Promise(function (resolve, rejected) {
        let url = index.send_url + '/chats/' + chat_id + '/write';
        let data = {
            url: url,
            method: 'POST',
            body: {
                'type': 'audio/mp4',
                'content': file
            },
            headers: {
                'X-Namba-Auth-Token': index.token
            },
            json: true
        };

        request(data, function (error, res, body) {
            if (error){
                rejected(error)
            }
            resolve(body)
        });
    });
};

module.exports.createChat = function (id_user) {
    return new Promise(function (resolve, rejected) {
        let url = index.send_url + '/chats/create';
        let data = {
            url: url,
            method: 'POST',
            body: {
                name: 'chat_with_' + id_user,
                image: '',
                members: [id_user]

            },
            json: true,
            headers: {
                'X-Namba-Auth-Token': index.token
            }
        };
        request(data, function (error, res, body) {
            if (error){
                rejected(error)
            }
            resolve(body)
        });
    })
};


module.exports.getPlayList = function (id) {
    return new Promise(function (resolve, rejected) {
        request({
            url: nambamusik + id,
            method: 'POST',
            json: true
        }, function (error, res, body) {
           if (error || res.statusCode === 404){
               rejected(error)
           }else{
               resolve(body)
           }
        })
    });
};