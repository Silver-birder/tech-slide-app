import logo from './logo.svg';
import './App.css';
import { FirestoreCollection, withFirestore } from 'react-firestore';
import React from 'react';

const arrayChunk = ([...array], size = 1) => {
  return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

class App extends React.Component {
  state = {
    slides: [],
  };

  async componentDidMount() {
    const { firestore } = this.props;
    var unsubscribeList = [];
    let dt = new Date();
    let month = dt.getMonth() + 1;
    dt.setMonth(month - 2);
    firestore
      .collection('tweets')
      .where('createdAt', '>', dt)
      .where('createdAt', '<', new Date())
      .onSnapshot(snapshot => {
        let slides = {};
        snapshot.docs.map((doc) => {
          const data = doc.data();
          const slideIdList = data.slideIdList;
          slideIdList.map((slideId) => {
            if (!slides.hasOwnProperty(slideId)) {
              slides[slideId] = {};
              slides[slideId]['count'] = 1;
              slides[slideId]['likeCount'] = data.likeCount;
              slides[slideId]['quoteCount'] = data.quoteCount;
              slides[slideId]['replyCount'] = data.replyCount;
              slides[slideId]['retweetCount'] = data.retweetCount;
              slides[slideId]['totalCount'] = 1 + data.likeCount + data.quoteCount + data.replyCount + data.retweetCount;
              slides[slideId]['createdAt'] = data.createdAt.toDate();
            } else {
              slides[slideId]['count'] = slides[slideId]['count'] + 1;
              slides[slideId]['likeCount'] = slides[slideId]['likeCount'] + data.likeCount;
              slides[slideId]['quoteCount'] = slides[slideId]['quoteCount'] + data.quoteCount;
              slides[slideId]['replyCount'] = slides[slideId]['replyCount'] + data.replyCount;
              slides[slideId]['retweetCount'] = slides[slideId]['retweetCount'] + data.retweetCount;
              slides[slideId]['totalCount'] = slides[slideId]['count'] + slides[slideId]['totalCount'] + data.likeCount + data.quoteCount + data.replyCount + data.retweetCount;
              slides[slideId]['createdAt'] = slides[slideId]['createdAt'] > data.createdAt.toDate() ? slides[slideId]['createdAt'] : data.createdAt.toDate();
            }
          });
        });
        if (unsubscribeList.length > 0) {
          unsubscribeList.map((unsubscribe) => {
            unsubscribe();
          });
          unsubscribeList = [];
        }
        const slideIdList10 = arrayChunk(Object.keys(slides), 10);
        this.setState({ slides: [] });
        slideIdList10.map((slideIdList) => {
          const unsubscribe = firestore
            .collection('slides')
            .where('id', 'in', slideIdList)
            .onSnapshot(snapshot => {
              snapshot.docs.map((doc) => {
                const data = doc.data();
                const id = data.id;
                const slide = slides[id];
                slides[id] = Object.assign(slide, data);
              });
              let tmpSlides = Object.entries(slides);
              tmpSlides.sort(function (p1, p2) {
                var p1Key = p1[1].totalCount, p2Key = p2[1].totalCount;
                if (p1Key < p2Key) { return 1; }
                if (p1Key > p2Key) { return -1; }
                return 0;
              })
              this.setState({ slides: tmpSlides });
            });
          unsubscribeList.push(unsubscribe);
        });
      });
  }

  render() {
    return (
      <div className="App">
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {this.state.slides.map((slide) => {
            return (
              <div className="col" key={slide[0]}>
                <div className="card">
                  <div className="card-header">
                    <span>
                      {slide[1].site_name}
                    </span>
                    <span className="badge bg-secondary">
                      {slide[1].totalCount}
                    </span>
                  </div>
                  <img src={slide[1].image} className="card-img-top"></img>
                  <div className="card-body">
                    <h5 className="card-title">
                      {slide[1].title}
                    </h5>
                    <p className="card-text">
                      {slide[1].description}
                    </p>
                    <a href={slide[1].url} className="btn btn-primary">Go the slide</a>
                  </div>
                  <div className="card-footer">
                    <small className="text-muted">
                      Update {slide[1].createdAt.getFullYear()}/{slide[1].createdAt.getMonth() + 1}/{slide[1].createdAt.getDate()} {slide[1].createdAt.getHours()}:{slide[1].createdAt.getMinutes()}:{slide[1].createdAt.getSeconds()}
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

export default withFirestore(App);
