import logo from './logo.svg';
import './App.css';
import { FirestoreCollection, withFirestore } from 'react-firestore';
import React from 'react';

const arrayChunk = ([...array], size = 1) => {
  return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

class App extends React.Component {
  state = {
    tweets: [],
    slides: [],
    users: [],
  };

  async componentDidMount() {
    const { firestore } = this.props;
    // const snapshot = await firestore.collection('tweets').where('likeCount', '>', 0).get();
    // const dataList = snapshot.docs.map((doc) => {
    //   return doc.data();
    // });
    // this.setState({tweets: dataList});
    var unsubscribeList = [];
    firestore
      .collection('tweets')
      .where('createdAt', '>', new Date("2021-06-01"))
      .where('createdAt', '<', new Date('2021-07-01'))
      .onSnapshot(snapshot => {
        this.setState({ tweets: snapshot.docs.map((doc) => doc.data()) });
        let slideIdList = Array.from(new Set(snapshot.docs.map((doc) => {
          const data = doc.data();
          return data.slideIdList;
        }).flat()));
        slideIdList = slideIdList.concat(slideIdList);
        if (unsubscribeList.length > 0) {
          unsubscribeList.map((unsubscribe) => {
            unsubscribe();
          });
          unsubscribeList = [];
        }
        const slideIdList10 = arrayChunk(slideIdList, 10);
        this.setState({ slides: [] });
        slideIdList10.map((slideIdList) => {
          const unsubscribe = firestore
            .collection('slides')
            .where('id', 'in', slideIdList)
            .onSnapshot(snapshot => {
              const slides = this.state.slides.concat(snapshot.docs.map((doc) => doc.data()));
              this.setState({ slides: slides });
            });
          unsubscribeList.push(unsubscribe);
        });
      });
  }

  render() {
    return (
      <div className="App">
        {this.state.tweets.map((tweet) => {
          return (<div key={tweet.id}>{tweet.text}</div>)
        })}
        {this.state.slides.map((slide) => {
          return (<div key={slide.id}>{slide.url}</div>)
        })}
        {/* <FirestoreCollection
          path="tweets"
          render={({ isLoading, data }) => {
            return isLoading ? (
              <div>loading ...</div>
            ) : (
              <div>
                <h1>Tweets</h1>
                <ul>
                  {data.map(tweet => (
                    <li key={tweet.id}>
                      {tweet.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }}
        /> */}
      </div>
    );
  }
}

export default withFirestore(App);
