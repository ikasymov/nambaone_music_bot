var Sequelize = require('sequelize');

var sequelize = new Sequelize('d31u4dnupju93c', 'kjsfpaeectysvg', 'a6ca27b3ce31df3fa75063be9aa361bcf361592086693195e2212c6c76305dac', {
    host: 'ec2-184-73-167-43.compute-1.amazonaws.com',
    dialect: 'postgres',
    dialectOptions: {
        ssl: true
    },
    pool: {
        max: 3,
        min: 0,
        idel: 10000
    },
    storage: 'postgres://kjsfpaeectysvg:a6ca27b3ce31df3fa75063be9aa361bcf361592086693195e2212c6c76305dac@ec2-184-73-167-43.compute-1.amazonaws.com:5432/d31u4dnupju93c'
});


// sequelize.authenticate().then(function () {
//
// }).catch(function (error) {
//    console.log(error)
// });
var User = sequelize.define('user', {
    user_id: {
        type: Sequelize.STRING,
        unique: true
    }
});

module.exports.User = User;
module.exports.sequelize = sequelize;



