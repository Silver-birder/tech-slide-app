import { withFirestore } from 'react-firestore';
import React from 'react';

class SlideInfo {
    count = 0
    likeCount = 0
    quoteCount = 0
    replyCount = 0
    retweetCount = 0
    totalCount = 0
    hashTags = []
    users = []
    tweets = []
    createdAt
    constructor(data, users) {
        this.tweetCount = 1;
        this.likeCount = data.likeCount;
        this.quoteCount = data.quoteCount;
        this.replyCount = data.replyCount;
        this.retweetCount = data.retweetCount;
        this.totalCount = this.calcTotalCount();
        this.hashTags = data.hashTags;
        this.createdAt = data.createdAt.hasOwnProperty('toDate') ? data.createdAt.toDate() : data.createdAt;
        this.users = users;
    }
    calcTotalCount() {
        return this.tweetCount + this.likeCount + this.quoteCount + this.replyCount;
    }
    merge(slideInfo) {
        const data = {
            likeCount: this.likeCount + slideInfo.likeCount,
            quoteCount: this.quoteCount + slideInfo.quoteCount,
            replyCount: this.replyCount + slideInfo.replyCount,
            retweetCount: this.retweetCount + slideInfo.retweetCount,
            totalCount: this.totalCount + slideInfo.totalCount,
            hashTags: this.hashTags.concat(slideInfo.hashTags),
            createdAt: this.createdAt > slideInfo.createdAt ? this.createdAt : slideInfo.createdAt
        }
        return new SlideInfo(data, this.users.concat(slideInfo.users));
    }
}

class SlideList extends React.Component {
    state = {
        slideList: [],
        tweetCount: 0,
    };

    async componentDidMount() {
        await this.start();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            prevProps.startDate !== this.props.startDate ||
            prevProps.hosts.slideshare !== this.props.hosts.slideshare ||
            prevProps.hosts.googleslide !== this.props.hosts.googleslide ||
            prevProps.hosts.speakerdeck !== this.props.hosts.speakerdeck
        ) {
            await this.start();
        }
    }
    start() {
        const { firestore } = this.props;
        let hosts = [];
        if (this.props.hosts.slideshare) {
            hosts.push('www.slideshare.net');
        }
        if (this.props.hosts.googleslide) {
            hosts.push('docs.google.com');
        }
        if (this.props.hosts.speakerdeck) {
            hosts.push('speakerdeck.com')
        }
        firestore
            .collection('tweets')
            .where('createdAt', '>=', new Date(`${this.props.startDate.replaceAll('-', '/')} 00:00:00`))
            .where('createdAt', '<=', new Date(`${this.props.startDate.replaceAll('-', '/')} 23:59:59`))
            .where('slideHosts', 'array-contains-any', hosts)
            .limit(1000)
            .onSnapshot(this.handleTweets.bind(this));
    }

    async handleTweets(snapshot) {
        this.setState({ slideList: [] });
        let slideMap = {};
        snapshot.docs.map((doc) => {
            const tweet = doc.data();
            tweet.slides.map((slide) => {
                if (!slideMap.hasOwnProperty(slide.id)) {
                    slideMap[slide.id] = [];
                }
                const user = tweet.user;
                delete tweet.slides;
                delete tweet.slideIdList;
                delete tweet.slideHosts;
                delete tweet.user;
                tweet.totalCount = tweet.likeCount + tweet.quoteCount + tweet.replyCount + tweet.retweetCount + 1;
                slideMap[slide.id].push({ 'slide': slide, 'tweet': tweet, 'user': user });
            });
        });
        const slideIds = Object.keys(slideMap);
        slideIds.sort((a, b) => {
            const TotalCount1 = slideMap[a].reduce((accumulator, obj) => {
                accumulator += obj.tweet.totalCount;
                return accumulator;
            }, 0);
            const TotalCount2 = slideMap[b].reduce((accumulator, obj) => {
                accumulator += obj.tweet.totalCount;
                return accumulator;
            }, 0);
            if (TotalCount1 > TotalCount2) {
                return -1;
            } else if (TotalCount1 < TotalCount2) {
                return 1;
            } else {
                return 0;
            }
        });
        let slideList = [];
        slideIds.map((slideId) => {
            slideList.push(slideMap[slideId]);
        });
        this.setState({ slideList: slideList, tweetCount: snapshot.docs.length });
    };

    render() {
        return (
            <div className="mt-5">
                <div className="position-relative">
                    <div className="position-absolute top-0 end-0">
                        Gather the {this.state.tweetCount} tweets.
                    </div>
                </div>
                <div className="row row-cols-1 row-cols-md-3 g-4">
                    {this.state.slideList.map((data) => {
                        const slides = data.map((d) => d.slide);
                        const slide = slides[0];
                        const tweets = data.map((d) => d.tweet);
                        const tweetsTotalCount = tweets.reduce((accumulator, obj) => {
                            return accumulator + obj.totalCount;
                        }, 0);
                        const newestCreatedAt = tweets.reduce((accumulator, obj) => {
                            return obj.createdAt > accumulator.createdAt ? obj : accumulator;
                        }).createdAt.toDate();
                        const strNewestCreatedAt = `${newestCreatedAt.getFullYear()}/${(newestCreatedAt.getMonth() + 1).toString().padStart(2, "0")}/${newestCreatedAt.getDate().toString().padStart(2, "0")} ${newestCreatedAt.getHours().toString().padStart(2, "0")}:${newestCreatedAt.getMinutes().toString().padStart(2, "0")}:${newestCreatedAt.getSeconds().toString().padStart(2, "0")}`;
                        const users = data.map((d) => d.user);
                        const hashTags = Array.from(new Set(tweets.map((tweet) => {
                            return tweet.hashTags;
                        }).flat()));
                        return (
                            <div className="col" key={slide.id} data-id={slide.id}>
                                <div className="card">
                                    <div className="card-header">
                                        <span>
                                            {slide.host} <span className="badge bg-secondary">{tweetsTotalCount}</span>
                                        </span>
                                    </div>
                                    <img src={slide.image} className="card-img-top"></img>
                                    <div className="card-body">
                                        <h5 className="card-title">
                                            {slide.title}
                                        </h5>
                                        <p className="card-text">
                                            {slide.description}
                                        </p>
                                        <a href={slide.url} className="btn btn-primary" target="_blank">Go the presentation</a>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item text-start">
                                                {users.map((user, index) => {
                                                    if (!user) { return; }
                                                    return (
                                                        <a href={`https://twitter.com/${user.userName}`} key={user.id + "-" + index} data-id={user.id} target="_blank">
                                                            <img src={user.profileImageUrl} className="border border-5 rounded-circle" />
                                                        </a>
                                                    )
                                                })}
                                            </li>
                                            <li className="list-group-item text-start">
                                                {hashTags.map((hashTag) => {
                                                    return (
                                                        <div key={hashTag} data-id={hashTag}>
                                                            <a href={`https://twitter.com/hashtag/${hashTag}`} target="_blank">#{hashTag}</a>
                                                        </div>
                                                    )
                                                })}</li>
                                            <li className="list-group-item text-start table-responsive">
                                                <table className="table table-striped table-hover ">
                                                    <thead>
                                                        <tr>
                                                            <th scope="col">#</th>
                                                            <th scope="col">Tweet</th>
                                                            <th scope="col">Like</th>
                                                            <th scope="col">Quote</th>
                                                            <th scope="col">Reply</th>
                                                            <th scope="col">Retweet</th>
                                                            <th scope="col">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tweets.map((tweet) => {
                                                            return (
                                                                <tr key={tweet.id} data-id={tweet.id}>
                                                                    <td scope="row"><a href={`https://twitter.com/web/status/${tweet.id}`} target="_blank"><i class="bi bi-link-45deg"></i></a></td>
                                                                    <td>1</td>
                                                                    <td>{tweet.likeCount}</td>
                                                                    <td>{tweet.quoteCount}</td>
                                                                    <td>{tweet.replyCount}</td>
                                                                    <td>{tweet.retweetCount}</td>
                                                                    <td>{tweet.totalCount}</td>
                                                                </tr>
                                                            )
                                                        })}
                                                        <tr>
                                                            <th colSpan="6">Total</th>
                                                            <td>{tweetsTotalCount}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="card-footer">
                                        <small className="text-muted">
                                            Update {strNewestCreatedAt}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default withFirestore(SlideList);
