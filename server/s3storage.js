
var aws = require('aws-sdk');

module.exports = S3Storage;

function S3Storage() {
  var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
  var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
  this.S3_BUCKET = process.env.S3_BUCKET;
  aws.config.update({ accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY });
  this.s3 = new aws.S3({ params: { Bucket: this.S3_BUCKET }});
}
S3Storage.prototype.exists = function(key) {
  return new Promise(function(resolve, reject) {
    this.s3.headObject({ Key: key }, function(err, headRes) {
      resolve(headRes || err.code !== 'NotFound');
    });
  }.bind(this));
}
S3Storage.prototype.upload = function(key, stream) {
  return new Promise(function(resolve, reject) {
    var s3obj = new aws.S3({
      params: {
        Bucket: this.S3_BUCKET,
        Key: key,
        ACL: 'public-read'
      }
    });
    s3obj.upload({ Body: stream }).
      on('httpUploadProgress', function(evt) { console.log(evt); }).
      send(function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
  }.bind(this));
}
S3Storage.prototype.urlForKey = function(key) {
  return 'https://' + this.S3_BUCKET + '.s3.amazonaws.com/' + encodeURIComponent(key);
}
