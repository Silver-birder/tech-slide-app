import './App.css';
import React from 'react';
import SearchConf from './components/search-conf';
import SlideList from './components/slide-list';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <SearchConf></SearchConf>
        <SlideList startDate={new Date("2021-06-26")} endDate={new Date("2021-06-27")}></SlideList>
      </div>
    );
  }
}

export default App;
