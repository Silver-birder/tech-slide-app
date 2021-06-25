const Twitter = require('twitter-v2');
const crypto = require('crypto');
const url = require('url');
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class Tweet {
    id
    text
    createdAt
    hashTags
    retweetCount
    replyCount
    likeCount
    quoteCount
    slideIdList
    slidesClass = [];
    userId
    constructor(data) {
        this.id = data.id;
        this.text = data.text;
        this.createdAt = new Date(data.created_at);
        this.hashTags = data.entities.hasOwnProperty('hashtags') ? data.entities.hashtags.map((h) => {
            return h.tag;
        }) : [];
        this.slideIdList = data.entities.hasOwnProperty('urls') ? data.entities.urls.filter((u) => {
            return new RegExp("(speakerdeck.com|slideshare.net|docs.google.com)").test(u.expanded_url);
        }).map((u) => {
            const wu = new url.URL(u.expanded_url);
            const canonicalURL = `${wu.protocol}//${wu.host}${wu.pathname}`;
            const hashURL = crypto.createHash('sha256').update(canonicalURL).digest('hex');
            this.slidesClass.push(new Slide({ id: hashURL, url: canonicalURL }));
            return hashURL;
        }) : [];
        this.retweetCount = data.public_metrics.retweet_count;
        this.replyCount = data.public_metrics.reply_count;
        this.likeCount = data.public_metrics.like_count;
        this.quoteCount = data.public_metrics.quote_count;
        this.userId = data.author_id;
    }
    toJson() {
        return {
            id: this.id,
            text: this.text,
            createdAt: this.createdAt,
            hashTags: this.hashTags,
            retweetCount: this.retweetCount,
            replyCount: this.replyCount,
            likeCount: this.likeCount,
            quoteCount: this.quoteCount,
            slideIdList: this.slideIdList,
            userId: this.userId,
        }
    }
}

class Slide {
    id
    url
    constructor(data) {
        this.id = data.id;
        this.url = data.url;
    }
    toJson() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
            a[b] = this[b];
            return a;
        }, {});
    }
    async fetch() {
        let res = null;
        try {
            res = await (await fetch(this.url)).text();
        } catch(e) {
            console.log(e);
            return;
        }
        const dom = new JSDOM(res);
        const nodeList = dom.window.document.querySelectorAll('[property^="og:"]');
        for (var i = 0; i < nodeList.length; i++) {
            var item = nodeList[i];
            const property = item.getAttribute('property').slice(3);
            const content = item.getAttribute('content');
            this[property] = content;
        }
    }
}

class TwitterUser {
    id
    name
    userName
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.userName = data.username;
    }
    toJson() {
        return {
            id: this.id,
            name: this.name,
            userName: this.userName
        }
    }
}

const client = new Twitter({
    bearer_token: process.env.TWITTER_V2_BEARER_TOKEN,
});

(async () => {
    let next_token = "";
    let since_id = "";
    let counter = 0;
    const startTime = new Date();
    const m = startTime.getMinutes();
    startTime.setMinutes(m - 15);
    const endTime = new Date();
    while (true) {
        const query = 'has:links -is:reply -is:retweet -is:quote (url:"https://speakerdeck.com" OR url:"https://www.slideshare.net" OR url:"https://docs.google.com/presentation")';
        const option = {
            query: query,
            tweet: {
                fields: 'created_at,public_metrics,entities'
            },
            expansions: 'author_id',
            start_time: startTime,
            end_time: endTime,
            max_results: 100,
        }
        if (next_token) {
            option['next_token'] = next_token;
        }
        if (since_id) {
            // option['since_id'] = since_id;
            // delete option['start_time'];
        }
        console.log('option');
        console.log(option);
        const { data, includes, meta } = await client.get('tweets/search/recent', option);
        console.log(meta);
        console.log(`result_count: ${meta.result_count}`)
        if (meta.result_count == 0) {
            console.log('break for result_count:0');
            break;
        }
        if (meta.hasOwnProperty('next_token') && meta['next_token']) {
            next_token = meta['next_token'];
            console.log(`next_token: ${meta['next_token']}`);
        } else {
            next_token = null;
        };
        if (meta.hasOwnProperty('newest_id') && meta['newest_id']) {
            since_id = meta['newest_id'];
            console.log(`newest_id: ${since_id}`);
        } else {
            since_id = null;
        };
        let usersList = [];
        if (includes && includes.hasOwnProperty('users')) {
            usersList = includes.users.map((u) => {
                return new TwitterUser(u);
            }).reduce((array, item) => {
                if (!array.some(ar => ar.id == item.id)) {
                    array.push(item);
                }
                return array;
            }, []);
        }
        const tweetList = data.map((data) => {
            return new Tweet(data);
        }).reduce((array, item) => {
            if (!array.some(ar => ar.id == item.id)) {
                array.push(item);
            }
            return array;
        }, []);
        const slideList = tweetList.filter((tweet) => {
            return tweet.slidesClass.length > 0
        }).map((tweet) => {
            return tweet.slidesClass;
        }).flat().reduce((array, item) => {
            if (!array.some(ar => ar.id == item.id)) {
                array.push(item);
            }
            return array;
        }, []);
        console.log('slide fetch start');
        await Promise.all(slideList.map(async (slide) => {
            await slide.fetch();
        }));
        console.log('slide fetch end');
        console.log('promise all');
        await Promise.all(tweetList.map(async (tweet) => {
            console.log('tweet');
            let documentRef = firestore.collection('tweets').doc(tweet.id);
            const documentSnapshot = await documentRef.get();
            if (documentSnapshot.exists) {
                console.log('tweet exists');
                return await documentRef.update(tweet.toJson());
            } else {
                console.log('tweet not exists');
                return await documentRef.create(tweet.toJson());
            }
        }), slideList.map(async (slide) => {
            console.log('slide');
            let documentRef = firestore.collection('slides').doc(slide.id);
            const documentSnapshot = await documentRef.get();
            if (documentSnapshot.exists) {
                console.log('slide exists');
                return await documentRef.update(slide.toJson());
            } else {
                console.log('slide not exists');
                return await documentRef.create(slide.toJson());
            }
        }), usersList.map(async (user) => {
            console.log('user');
            let documentRef = firestore.collection('users').doc(user.id);
            const documentSnapshot = await documentRef.get();
            if (documentSnapshot.exists) {
                console.log('user exists');
                return await documentRef.update(user.toJson());
            } else {
                console.log('user not exists');
                return await documentRef.create(user.toJson());
            }
        }));

        console.log('close');
        if (next_token === null || since_id === null) {
            console.log('next_token or since_id is null. break');
            break;
        }
    }
})();