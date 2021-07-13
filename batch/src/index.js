require('dotenv').config();
const { MyTwitter } = require('./twitter/myTwitter');
const { MyFirestore } = require('./firestore/myFirestore');
const { DocFactory } = require('./firestore/myDocument');
const DOMAINS = [
    "https://speakerdeck.com",
    "https://www.slideshare.net",
    "https://docs.google.com/presentation"
];

const main = async () => {
    const twitter = new MyTwitter(DOMAINS);
    const params = {}
    // params['end_time'] = new Date();
    // const startTime = new Date();
    // startTime.setHours(startTime.getHours() - 6);
    // params['start_time'] = startTime;
    const [data, includes] = await twitter.gets(params);
    console.log(`${"-".repeat(100)}`);
    console.log('twitter response');
    console.log(`data: ${data.length} counts`);
    console.log(`includes: ${includes.length} counts`);
    const factory = new DocFactory(data, includes, DOMAINS);
    const [tweetList] = await factory.create();
    console.log(`${"-".repeat(100)}`);
    console.log('will save firestore documents');
    console.log(`tweetList: ${tweetList.length} counts`);
    const tf = new MyFirestore(tweetList, "tweets");
    const [tfr] = await Promise.all([tf].map(async (f) => {
        return await f.save();
    }));
    console.log(`${"-".repeat(100)}`);
    console.log('write firestore');
    console.log(`tweetList: ${tfr.length}`);
    console.log('end');
};

exports.main = main;