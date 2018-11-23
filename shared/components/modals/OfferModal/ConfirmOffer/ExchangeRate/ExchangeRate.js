import React from 'react'

import CSSModules from 'react-css-modules'
import styles from './ExchangeRate.scss'

import Row from '../Row/Row'
import Value from '../Value/Value'
import { FormattedMessage } from 'react-intl'


const title = [
  <FormattedMessage id="ExchangeRate12" defaultMessage="Exchange Rate" />
]

const ExchangeRate = ({ value, buyCurrency, sellCurrency }) => (
  <Row title={title}>
    <Value value={1 / Number(value)} currency={sellCurrency} />
    <FormattedMessage id="ExchangeRate14" defaultMessage="=">
      {message => <div styleName="equal">{message}</div>}
    </FormattedMessage>
    <Value value={1} currency={buyCurrency} />
  </Row>
)

export default CSSModules(ExchangeRate, styles)
