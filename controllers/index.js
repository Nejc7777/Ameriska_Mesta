const fs = require('fs');
const path = require('path');

const REDIS_PORT = 6379;

var Promise = require("bluebird");

const redis = require("redis");
const REDIS_URL = "redis://:p1bc04bc3c57a5d721e94c516db7f568d082fbec616d1d6892334785bd47ca276@ec2-52-50-82-196.eu-west-1.compute.amazonaws.com:27519";
const client = redis.createClient(REDIS_URL, {
    tls: {
        rejectUnauthorized: false
    }
});

client.on("error", function (error) {
    console.error("Error encountered: ", error);
});

client.on("connect", function (error) {
    console.log("Redis connection established");
});

let finalData=[];
let cities;

//check if data exits in redis
client.get('city_0', function(err, data) {
    // data is null if the key doesn't exist
    if(err || data === null) {
        let rawdata = fs.readFileSync(path.resolve("", 'public/JSON/cities.json'));
        cities = JSON.parse(rawdata);
        const lengthCities = cities.length;
        for(var i=0; i<lengthCities; i++){
            var city = cities[i];
            var keys = Object.keys(city);
            var stringCity = "{";
            keys.forEach((key, index) => {
                stringCity = stringCity + `\"${key}\":\"${city[key]}\"` + ', '
            });
            stringCity = stringCity.substring(0, stringCity.length - 2);
            stringCity = stringCity + "}"
            console.log(stringCity);
            client.set(`city_${i}`,stringCity,'NX', function(err) {
                if (err) {
                    // Something went wrong
                    console.error("error" + err);
                } else {
                    client.get(`city_${i}`, function(err, value) {
                        if (err) {
                            console.error("error");
                        } else {
                            console.log("Worked: " + value);
                        }
                    });
                }
            });
        }
    }
    //stringToObject();
});

var dataArray = new Object();

async function stringToObject(){
    var string;
    var keyList = [];
    await client.keys('*',async function (err, keys) {
        if (err){
            return console.log(err);
        }
        keyList = await keys;
        for(var i = 0; i < keyList.length; i++) {
            dataArray[i]= await asyncReq(i);
            if(i==keyList.length - 1){
                //console.log(dataArray);
            }
        }
    });
    return dataArray;
}

function asyncReq (i){
    return  new Promise((resolve, reject) => {
        client.get(`city_${i}`, function(err, value) {
            if (err) {
                console.error("error");
            } else {
                tempObject = (JSON.parse(value));
                if(tempObject.city != null){
                    resolve(tempObject);
                }
            }
        });
    })
}

stringToObject();
exports.index =  async function(req, res, next){
    stringToObject()
        .then(    res.render('index', {
            title: 'Ameriška mesta',
            data:  dataArray
        }))
};
