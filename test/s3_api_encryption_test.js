"use strict"

var AWS = require('aws-sdk');
var expect = require("chai").expect;
var assert = require("chai").assert;
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

// some constants
const BUCKET_NAME = "abcderftaa";//crypto.randomBytes(10).toString('hex');
const FILE_TO_UPLOAD = path.join(__dirname, "resources", "hello.txt");
const ENCRYPTION_KEY_AES_256 = crypto.randomBytes(32);
const S3_OBJECT_NO_ENCRYPTION = "no_encryption_file.txt";
const S3_OBJECT_ENCRYPTION_SSE_S3 = "sse_s3.txt";
const S3_OBJECT_ENCRYPTION_SSE_C = "sse_c.txt";
const S3_OBJECT_ENCRYPTION_SSE_KMS = "sse_kms.txt";

// conf for key alias 
var nconf = require('nconf');
nconf
    .env()
    .file(
        {file: path.join("test/config", "config.json")});

// Key id for kms encryption
const S3_KMS_KEY_ID = nconf.get("S3_KMS_KEY_ID");

// congig aws
AWS.config = {
    region: "eu-west-1",
};

describe("AWS S3 Test", function () {
    var s3 = new AWS.S3({signatureVersion: 'v4'});

    describe("Creating Random S3 bucket", function () {
        it("Should succeed", function (done) {

            s3.createBucket({Bucket: BUCKET_NAME}, function () {
                }) // could do
                .on('success', function (response) {
                    done();
                }).on('error', function (err, response) {
					console.log(err);
                expect(err).not.to.be.null;
                expect(err.statusCode).equals(409);
                done();
            });
        });

        describe("Created bucket", function () {
            it("should exists in S3", function (done) {
                s3.headBucket({Bucket: BUCKET_NAME}, function (err, data) {
                    expect(err).to.be.null;
                    expect(data).not.to.be.null;
                    done();
                })
            });
        });

        describe("Listing bucket", function () {
            it.skip("should return one bucket", function (done) {
                s3.listBuckets(function (err, data) {
                    var expectedNumberOfBuckets = 1;
                    expect(err).to.be.null;
                    expect(data.Bucket).not.to.be.null;
                    assert.equal(data.Buckets.length, expectedNumberOfBuckets, "Number of bucket should be equals to 1");
                    done();
                });
            });
        });

        describe("Uploading an object in S3", function () {
            var inputStream = null;
            beforeEach("File Upload", function () {
                inputStream = fs.createReadStream(FILE_TO_UPLOAD);
                inputStream.on('open', function () {
                    //console.log("opening file");
                });
                inputStream.on('close', function () {
                    //console.log('closing file');
                });
            });

            describe("Without encryption", function () {
                it("should be successfull", function (done) {
                    s3.putObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_NO_ENCRYPTION,
                        Body: inputStream
                    }, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the object should exist in S3", function (done) {
                    s3.headObject({Bucket: BUCKET_NAME, Key: S3_OBJECT_NO_ENCRYPTION}, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the object can be retrieved back", function (done) {
                    s3.getObject({Bucket: BUCKET_NAME, Key: S3_OBJECT_NO_ENCRYPTION}, function (err, data) {
                        assert.equal(data.Body.toString(), "hello", 'Content of the object should be equal to hello');
                        expect(err).to.be.null;
                        done();
                    });
                });
            });

            /**
             * Server Side Encryption
             */
            describe("With SSE-S3 (AES256) encryption", function () {
                it("Should be successfull", function (done) {
                    s3.putObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_S3,
                        Body: inputStream,
                        ServerSideEncryption: 'AES256'
                    }, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the object should exist in S3", function (done) {
                    s3.headObject({Bucket: BUCKET_NAME, Key: S3_OBJECT_ENCRYPTION_SSE_S3}, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the object can be retrieved back", function (done) {
                    s3.getObject({Bucket: BUCKET_NAME, Key: S3_OBJECT_ENCRYPTION_SSE_S3}, function (err, data) {
                        assert.equal(data.Body.toString(), "hello", 'Content of the object should be equal to hello');
                        expect(err).to.be.null;
                        done();
                    });
                });
            });

            /* *
             * Client side encryption
             *
             */
            describe("With SSE-C (AES256) encryption", function () {
                var md5sum = crypto.createHash('md5');
                var keyCheckSum = md5sum.update(ENCRYPTION_KEY_AES_256).digest('base64');

                it("Should be successfull", function (done) {
                    s3.putObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_C,
                        Body: inputStream,
                        SSECustomerKeyMD5: keyCheckSum,
                        SSECustomerAlgorithm: 'AES256',
                        SSECustomerKey: ENCRYPTION_KEY_AES_256
                    }, function (err, data) {
                        expect(err).to.be.null;
                        assert.equal(data.SSECustomerKeyMD5, keyCheckSum, 'the return checksum for the key should be ' + keyCheckSum);
                        done();
                    });
                });

                it("And the object should exist in S3", function (done) {
                    s3.headObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_C,
                        SSECustomerKeyMD5: keyCheckSum,
                        SSECustomerAlgorithm: 'AES256',
                        SSECustomerKey: ENCRYPTION_KEY_AES_256
                    }, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the the object can be read back with correct key", function (done) {
                    var md5sum = crypto.createHash('md5');
                    md5sum.update(ENCRYPTION_KEY_AES_256).toString('hex');
                    s3.getObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_C,
                        SSECustomerAlgorithm: 'AES256',
                        SSECustomerKey: ENCRYPTION_KEY_AES_256
                    }, function (err, data) {
                        expect(err).to.be.null;
                        // expect(data.data.statusCode).equals(200);
                        assert.equal(data.Body.toString(), 'hello');
                        done();
                    });
                });

                it("And the object can not be read back with wrong key", function (done) {
                    var md5sum = crypto.createHash('md5');
                    md5sum.update(ENCRYPTION_KEY_AES_256).toString('hex');
                    var KEY_WRONG = crypto.randomBytes(32);
                    s3.getObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_C,
                        SSECustomerAlgorithm: 'AES256',
                        SSECustomerKey: KEY_WRONG
                    }, function (err, data) {
                        expect(err).not.to.be.null;
                        expect(err.statusCode).equals(403);
                        done();
                    });
                });
            });

            describe("With SSE-KMS encryption", function () {
                it("The call should succeed", function (done) {
                    s3.putObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_KMS,
                        Body: inputStream,
                        ServerSideEncryption: 'aws:kms',
                        SSEKMSKeyId: S3_KMS_KEY_ID
                    }, function (err, data) {
                        done();
                    });
                });

                it("And the object should exist in S3", function (done) {
                    s3.headObject({Bucket: BUCKET_NAME, Key: S3_OBJECT_ENCRYPTION_SSE_KMS}, function (err, data) {
                        expect(err).to.be.null;
                        done();
                    });
                });

                it("And the object can be retrieved back", function (done) {
                    s3.getObject({
                        Bucket: BUCKET_NAME,
                        Key: S3_OBJECT_ENCRYPTION_SSE_KMS,
                    }, function (err, data) {
                        assert.equal(data.Body.toString(), "hello", 'Content of the object should be equal to hello');
                        expect(err).to.be.null;
                        done();
                    });
                });
            });
        });
    });

    describe.skip("Deleting S3 bucket", function () {
        it("Deleting files", function (done) {
            s3.deleteObjects({
                    Bucket: BUCKET_NAME,
                    Delete: {Objects: [{Key: S3_OBJECT_ENCRYPTION_SSE_C}, {Key: S3_OBJECT_ENCRYPTION_SSE_KMS}, {Key: S3_OBJECT_ENCRYPTION_SSE_S3}, {Key: S3_OBJECT_NO_ENCRYPTION}]}
                },
                function (err, res) {
                    expect(err).to.be.null;
                    done();
                });
        });

        it("Deleting S3 bucket", function (done) {
            s3.deleteBucket({Bucket: BUCKET_NAME}, function (err, res) {
                expect(err).to.be.null;
                done();
            });
        });
    });
});
