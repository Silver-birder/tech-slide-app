import React from 'react';
import SlideList from './slide-list';

const dateToString = (d) => {
    return `${d.getFullYear()}-${zeroPadding(d.getMonth() + 1)}-${zeroPadding(d.getDate())}`
}
const zeroPadding = (n) => {
    return ('00' + n).slice(-2);
}
class SlideArea extends React.Component {
    state = {
        startDate: dateToString(new Date()),
        endDate: dateToString(new Date()),
        selectSpeakerDeck: true,
        selectSlideShare: true,
        selectGoogleSlide: true,
    }
    onCheckboxChange(e) {
        const state = {};
        state[e.target.id] = e.target.checked;
        this.setState(state);
    }
    onDateChange(e) {
        const state = {};
        state[e.target.id] = e.target.value;
        this.setState(state);
    }
    render() {
        return (
            <div>
                <div>
                    <input type="date" id="startDate" name="startDate" onChange={this.onDateChange.bind(this)} value={this.state.startDate} /> 〜 <input type="date" id="endDate" name="endDate" onChange={this.onDateChange.bind(this)} value={this.state.endDate} />
                </div>
                <div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" id="selectSpeakerDeck" value="speackerdeck" onChange={this.onCheckboxChange.bind(this)} checked={this.state.selectSpeakerDeck} />
                        <label className="form-check-label" htmlFor="selectSpeakerDeck">SpeakerDeck</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" id="selectSlideShare" value="slideshare" onChange={this.onCheckboxChange.bind(this)} checked={this.state.selectSlideShare} />
                        <label className="form-check-label" htmlFor="selectSlideShare">SlideShare</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" id="selectGoogleSlide" value="googleslide" onChange={this.onCheckboxChange.bind(this)} checked={this.state.selectGoogleSlide} />
                        <label className="form-check-label" htmlFor="selectGoogleSlide">GoogleSlide</label>
                    </div>
                </div>
                <SlideList startDate={this.state.startDate} endDate={this.state.endDate}></SlideList>
            </div>
        )
    }
}

export default SlideArea;