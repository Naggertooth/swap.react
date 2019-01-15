import React, { Component } from 'react'
import PropTypes from 'prop-types'

import actions from 'redux/actions'
import { links } from 'helpers'

import CSSModules from 'react-css-modules'
import styles from './SwapList.scss'

import { FormattedMessage } from 'react-intl'


@CSSModules(styles, { allowMultiple: true })
export default class SwapList extends Component {

  static propTypes = {
    data: PropTypes.object,
  }

  static defaultProps = {
    data: {},
    whiteLogo: false,
  }

  render() {
    return (
      <div styleName="stepList">
        {
          this.props.data.step >= 1 ? (
            <div styleName={this.props.data.step === 1 && this.props.data.step < 2 ? 'stepItem active' : 'stepItem active checked'}>
              <span styleName="stepNumber">{this.props.data.step === 1 && this.props.data.step < 2 ? '1' : <i className="fas fa-check" />}</span>
              <p styleName="stepText">Confirmation processing</p>
            </div>
          ) : (
            <div styleName="stepItem">
              <span styleName="stepNumber">1</span>
              <p styleName="stepText">Confirmation processing</p>
            </div>
          )
        }

        {
          this.props.data.step >= 2 ? (
            <div styleName={this.props.data.step === 2 && this.props.data.step <= 3 ? 'stepItem active' : 'stepItem active checked'}>
              <span styleName="stepNumber">{this.props.data.step === 2 && this.props.data.step < 3 ? '2' : <i className="fas fa-check" />}</span>
              <p styleName="stepText">Bitcoin deposition</p>
            </div>
          ) : (
            <div styleName="stepItem">
              <span styleName="stepNumber">2</span>
              <p styleName="stepText">Bitcoin deposition</p>
            </div>
          )
        }

        {
          this.props.data.step >= 4 ? (
            <div styleName={this.props.data.step === 4 && this.props.data.step < 5 ? 'stepItem active' : 'stepItem active checked'}>
              <span styleName="stepNumber">{this.props.data.step === 4 && this.props.data.step < 5 ? '3' : <i className="fas fa-check" />}</span>
              <p styleName="stepText">Swap tokens deposition</p>
            </div>
          ) : (
            <div styleName="stepItem">
              <span styleName="stepNumber">3</span>
              <p styleName="stepText">Swap tokens deposition</p>
            </div>
          )
        }

        {
          this.props.data.step >= 5 ? (
            <div styleName={this.props.data.step >= 5 && this.props.data.step < 6 ? 'stepItem active' : 'stepItem active checked'}>
              <span styleName="stepNumber">{this.props.data.step >= 5 && this.props.data.step < 6 ? '4' : <i className="fas fa-check" />}</span>
              <p styleName="stepText">Withdrawing swap tokens from a contract</p>
            </div>
          ) : (
            <div styleName="stepItem">
              <span styleName="stepNumber">4</span>
              <p styleName="stepText">Withdrawing swap tokens from a contract</p>
            </div>
          )
        }
        {
          this.props.data.step >= 6 ? (
            <div styleName={this.props.data.step >= 6 && this.props.data.step < 7 ? 'stepItem active' : 'stepItem active checked'}>
              <span styleName="stepNumber">{this.props.data.step >= 6 && this.props.data.step < 7 ? '5' : <i className="fas fa-check" />}</span>
              <p styleName="stepText">Finished!</p>
            </div>
          ) : (
            <div styleName="stepItem">
              <span styleName="stepNumber">5</span>
              <p styleName="stepText">Finished!</p>
            </div>
          )
        }
      </div>
    )
  }
}
