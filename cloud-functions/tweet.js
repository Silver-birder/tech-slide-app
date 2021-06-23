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
        const res = await (await fetch(this.url)).text();
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
    const { data, includes, meta } = await client.get('tweets/search/recent', {
        query: 'has:links -is:reply -is:retweet -is:quote (url:"https://speakerdeck.com" OR url:"https://www.slideshare.net" OR url:"https://docs.google.com/presentation")',
        tweet: {
            fields: 'created_at,public_metrics,entities'
        },
        max_results: 10,
        expansions: 'author_id',
    });
    let usersList = [];
    if (includes.hasOwnProperty('users')) {
        usersList = includes.users.map((u) => {
            return new TwitterUser(u);
        })
    }
    const tweetList = data.map((data) => {
        return new Tweet(data);
    });
    const slideList = tweetList.filter((tweet) => {
        return tweet.slidesClass.length > 0
    }).map((tweet) => {
        return tweet.slidesClass;
    }).flat();
    await Promise.all(slideList.map(async (slide) => {
        await slide.fetch();
    }));
    let bulkWriter = firestore.bulkWriter();
    Promise.all([tweetList.map(async (tweet) => {
        let documentRef = firestore.collection('tweets').doc(tweet.id);
        const documentSnapshot = await documentRef.get();
        if (documentSnapshot.exists) {
            return await bulkWriter.update(documentRef, tweet.toJson());
        } else {
            return await bulkWriter.create(documentRef, tweet.toJson());
        }
    }), slideList.map(async (slide) => {
        let documentRef = firestore.collection('slides').doc(slide.id);
        const documentSnapshot = await documentRef.get();
        if (documentSnapshot.exists) {
            return await bulkWriter.update(documentRef, slide.toJson());
        } else {
            return await bulkWriter.create(documentRef, slide.toJson());
        }
    }), usersList.map(async (user) => {
        let documentRef = firestore.collection('users').doc(user.id);
        const documentSnapshot = await documentRef.get();
        if (documentSnapshot.exists) {
            return await bulkWriter.update(documentRef, user.toJson());
        } else {
            return await bulkWriter.create(documentRef, user.toJson());
        }
    })]);
})();