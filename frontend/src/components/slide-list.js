import { withFirestore } from 'react-firestore';
import React from 'react';

const arrayChunk = ([...array], size = 1) => {
    return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

class SlideInfo {
    count = 0
    likeCount = 0
    quoteCount = 0
    replyCount = 0
    retweetCount = 0
    totalCount = 0
    hashTags = []
    users = []
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
    };

    async componentDidMount() {
        await this.start();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            prevProps.startDate !== this.props.startDate ||
            prevProps.endDate !== this.props.endDate ||
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
            .where('createdAt', '<=', new Date(`${this.props.endDate.replaceAll('-', '/')} 23:59:59`))
            .where('slideHosts', 'array-contains-any', hosts)
            .limit(1000)
            .onSnapshot(this.handleTweets.bind(this));
    }

    async handleTweets(snapshot) {
        this.setState({ slideList: [] });
        let slideMap = {};
        snapshot.docs.map((doc) => {
            const data = doc.data();
            data.slides.map((slide) => {
                slideMap[slide.id] = slideMap.hasOwnProperty(slide.id) ? slideMap[slide.id].merge(new SlideInfo(data, [data.user])) : new SlideInfo(data, [data.user]);
                slideMap[slide.id] = Object.assign(slideMap[slide.id], slide);
            });
        });
        const slideIds = Object.keys(slideMap);
        slideIds.sort((a, b) => {
            if (slideMap[a].totalCount > slideMap[b].totalCount) {
                return -1;
            } else if (slideMap[a].totalCount < slideMap[b].totalCount) {
                return 1;
            } else {
                return 0;
            }
        });
        let slideList = [];
        slideIds.map((slideId) => {
            slideList.push(slideMap[slideId]);
        });
        this.setState({ slideList: slideList });
    };

    render() {
        return (
            <div className="row row-cols-1 row-cols-md-3 g-4">
                {this.state.slideList.map((slide) => {
                    return (
                        <div className="col" key={slide.id} data-id={slide.id}>
                            <div className="card">
                                <div className="card-header">
                                    <span>
                                        {slide.host} <span className="badge bg-secondary">{slide.totalCount}</span>
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
                                    <a href={slide.url} className="btn btn-primary" target="_blank">Go the slide</a>
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item text-start">
                                            {slide.users.map((user, index) => {
                                                return (
                                                    <a href={`https://twitter.com/${user.userName}`} key={user.id + "-" + index} data-id={user.id}>
                                                        <img src={user.profileImageUrl} className="border border-5 rounded-circle" />
                                                    </a>
                                                )
                                            })}
                                        </li>
                                        <li className="list-group-item text-start">
                                            {Array.from(new Set(slide.hashTags)).map((hashTag) => {
                                                return (
                                                    <div key={hashTag} data-id={hashTag}>
                                                        <a href={`https://twitter.com/hashtag/${hashTag}`}>#{hashTag}</a>
                                                    </div>
                                                )
                                            })}</li>
                                    </ul>
                                </div>
                                <div className="card-footer">
                                    <small className="text-muted">
                                        Update {slide.createdAt.toDate().getFullYear()}/{slide.createdAt.toDate().getMonth() + 1}/{slide.createdAt.toDate().getDate()} {slide.createdAt.toDate().getHours()}:{slide.createdAt.toDate().getMinutes()}:{slide.createdAt.toDate().getSeconds()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}

export default withFirestore(SlideList);
