import React from 'react';
import ReactDOM from 'react-dom';
import * as s from '../serverCalls.js';
import * as globalData from '../sampledata'


class Public extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      dataLoaded: false,
      data: '',
    }
    console.log('Props in public: ', props);
  }

  componentWillMount() {
    s.serverGet('public').then(e => {
      this.setState({
        dataLoaded: true,
        data: e.data
      })
    })
  } 

  render () {
    return (
      <div>
        {!this.state.dataLoaded ? null :
          <div>
            {this.state.data.map(e => {
              return this.props.click ? 
                (<div key={e._id}><a name={e._id} onClick={this.props.click} >{e.person}</a></div>) :
                (<div key={e._id}><a href={`analyses/${e._id}`} >{e.person}</a></div>)
            })}
          </div>
        }
      </div>
    )
  }
}

export default Public


