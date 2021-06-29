const Twitter = require('twitter-v2');
const os = require('os')

exports.MyTwitter = class MyTwitter {
    constructor(domains = []) {
        this.client = new Twitter({
            bearer_token: process.env.TWITTER_V2_BEARER_TOKEN,
        });
        this.query = `has:links -is:reply -is:retweet -is:quote (${domains.map((domain) => `url:"${domain}"`).join(" OR ")})`;
        this.defaultParams = {
            query: this.query,
            tweet: {
                fields: 'created_at,public_metrics,entities'
            },
            user: {
                fields: 'profile_image_url',
            },
            expansions: 'author_id',
            max_results: 100,
        }
    }
    async gets(params = {}) {
        let dataList = [];
        let includeList = [];
        let nextToken = null;
        let sinceId = null;
        while (true) {
            const { data, includes, meta } = await this.get(params);
            if (meta.result_count == 0) {
                console.log(`result_count: ${meta.result_count}.`);
                console.log('Stop the loop twitter request process.');
                break;
            }
            dataList = dataList.concat(data);
            includeList = includeList.concat(includes);

            if (dataList.length >= os.cpus().length * 100) {
                console.log(`over the data (dataList.length:${dataList.length}. os.cpus.length: ${os.cpus().length}).`);
                console.log('Stop the loop twitter request process.');
                break;
            }
            nextToken = meta.hasOwnProperty('next_token') && meta['next_token'] ? meta['next_token'] : null;
            sinceId = meta.hasOwnProperty('newest_id') && meta['newest_id'] ? meta['newest_id'] : null;
            if (nextToken === null || sinceId === null) {
                console.log(`not found nextToken(${nextToken}) or newestId(${sinceId}).`);
                console.log('Stop the loop twitter request process.');
                break;
            }
            params['next_token'] = nextToken;
            // params['since_id'] = sinceId;
        }
        return [dataList, includeList]
    }
    async get(params = {}) {
        const customParams = Object.assign(this.defaultParams, params);
        console.log('tweet request parameter is')
        console.log(customParams);
        return await this.client.get('tweets/search/recent', customParams);
    }
}