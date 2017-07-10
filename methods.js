var request = require('request');
var index = require('./index');
var fs = require('fs');
var nambamusik = 'http://namba.kg/api/?service=music&action=playlist_page&token=35ffJXTW3oSmvWOR&id=';

// 'type': 'audio/mp4',
//     'media/image'
module.exports.sendSms = function (chat_id, text, callback) {
    var url = index.send_url + '/chats/' + chat_id + '/write';
    var data = {
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
            console.log(error)
        }
        callback(body)
    });



    };

module.exports.sendMusic = function (chat_id, file, callback) {
    var url = index.send_url + '/chats/' + chat_id + '/write';
    var data = {
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
            console.log(error)
        }
        callback(body)
    });



};

module.exports.createChat = function (id_user, callback) {
    var url = index.send_url + '/chats/create';
    var data = {
        url: url,
        method: 'POST',
        body: {
            name: 'chat_with_' + id_user,
            image: 'YzU2OWM3YWY0YzcyZmYxZWEyODcyYmJlOTJhM2VkMjE2MDFjMDRhZWNhZDk3ODFiYzk0NDVkNjQzMDI0YjBlZjkyNWNhZWMxODkwYmZlYTRkNjY5NjQwYjNhNGY4MDUxNmJlYjg3OGQ0MTQxNWZiODNmZDBhOGViZDFlNTg3M2RlNzMyMzc1NTVjY2JmZWY4MmU0ODhiMjhjMjIyYjkxZDgyZWExZTdhMGE4N2E1NDcyNTIzYWM1YzM4NTNlYjczMDE2N2E1OGY0OWI4ZTUyMzJmNjE1OGI0YjNhOTI0MmU=',
            members: [id_user]

        },
        json: true,
        headers: {
            'X-Namba-Auth-Token': index.token
        }
    };
    request(data, function (error, res, body) {
        if (error){
            console.log(error)
        }
        callback(body)
    });

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
//
// function getImageToken() {
//     request.post({
//         url: 'https://files.namba1.co',
//         json: true,
//         formData: {
//             file: {
//                 value: './bug.jpg',
//                 options: {
//                     filename: 'bug.jpg'
//                 }
//             }
//         }
//     }, function (error, body) {
//         console.log(body)
//     })
// }


// var request2 = require('request');
// var obj = {};
// obj.parseImage = function(url, cb) {
//     request2({url: url, encoding: null, timeout: 10000}, function(err, res, page) {
//         if(!page) {
//             return obj.parseImage(url, cb);
//         }
//         request2.post({
//             url: 'https://files.namba1.co',
//             json: true,
//             formData: {
//                 file: {
//                     value: './',
//                     options: {
//                         filename: 'image.jpg'
//                     }
//                 }
//             }
//         }, function(err, res, body) {
//             cb(body.file);
//         });
//     })
// };