import React, { Component, Fragment } from 'react'

import { connect } from 'redaction'
import { constants, links } from 'helpers'
import { isMobile } from 'react-device-detect'
import { withRouter } from 'react-router'
import actions from 'redux/actions'

import { Link, Redirect } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'

import CSSModules from 'react-css-modules'
import styles from './Currency.scss'

import Title from 'components/PageHeadline/Title/Title'
import PageHeadline from 'components/PageHeadline/PageHeadline'
import SubTitle from 'components/PageHeadline/SubTitle/SubTitle'
import Table from 'components/tables/Table/Table'
import Toggle from 'components/controls/Toggle/Toggle'
import Row from './Row/Row'

import { withRouter } from 'react-router'
import { FormattedMessage, injectIntl } from 'react-intl'
import { localisedUrl } from '../../helpers/locale'



@injectIntl
@withRouter
@connect(({ core: { hiddenCoinsList }, user: { ethData, btcData, ltcData, tokensData, eosData, nimData, usdtData } }) => ({
  tokens: Object.keys(tokensData).map(k => (tokensData[k])),
  items: [ ethData, btcData, eosData, usdtData, ltcData /* nimData */ ],
  hiddenCoinsList,
}))
@CSSModules(styles, { allowMultiple: true })
export default class Currency extends Component {

  state = {
    isBalanceFetching: false,
    balance: '',
  }

  componentWillMount() {
    const { match: { params: { currency } }, items } = this.props
    const item = items.map(item => item.currency.toLowerCase())

    if (!item.includes(currency)) {
      this.props.history.push('/NotFound')
      console.log(item)
      return
    }
    this.getCoin()
    const { balance } = this.getCoin()

    this.setState({ balance })
    this.handleReloadBalance()
  }

  getRows = () => {
    let { match:{ params: { currency } } } = this.props
    currency = currency.toLowerCase()

    return constants.tradeTicker
      .filter(ticker => {
        ticker = ticker.split('-')
        return currency === ticker[0].toLowerCase()
          ? ticker[0].toLowerCase() === currency
          : ticker[1].toLowerCase() === currency
      })
      .map(pair => {
        pair = pair.split('-')
        return {
          from: pair[0],
          to: pair[1],
        }
      })
  }

  getCurrencyName = () => this.props.match.params.currency.toLowerCase()
  getCoin = () => [...this.props.items, ...this.props.tokens].find(coin => coin.currency.toLowerCase() === this.getCurrencyName())

  handleReloadBalance = () => {
    const { isBalanceFetching } = this.state
    const coin = this.getCoin()
    const currency = coin.currency.toLowerCase()
    const token = !!coin.token
    const action = token ? 'token' : currency

    if (isBalanceFetching) {
      return null
    }

    this.setState({
      isBalanceFetching: true,
    })

    actions[action]
      .getBalance(currency)
      .finally(() => this.setState({
        isBalanceFetching: false,
      }))
  }

  isInWallet = () => !this.props.hiddenCoinsList.includes(this.getCoin().currency)

  handleInWalletChange = (val) => val ? actions.core.markCoinAsVisible(this.getCoin().currency) :
    actions.core.markCoinAsHidden(this.getCoin().currency)

  componentWillMount = () => {
    const { intl: { locale } } = this.props
    if (!this.getCoin()) {
      this.props.history.push(localisedUrl(locale, '/'))
      return false
    }

    this.handleReloadBalance()
  }

  render() {
    const { match: { params: { currency } } } = this.props
    const { balance } = this.state

    return (
      <section styleName={isMobile ? 'currencyMobileSection' : 'currencyMediaSection'}>
        <PageHeadline>
          <Fragment>
            <div styleName="currencyTitle">
              <Title>{currency}</Title>
            </div>
            <SubTitle>
              {currency.toUpperCase()}
              <FormattedMessage id="Currency110" defaultMessage="Trade" />
            </SubTitle>
          </Fragment>
          <div styleName="currencyBalance">
            <FormattedMessage id="Currency101" defaultMessage="Balance: " />
            <span styleName="currencyBalanceValue">{(String(balance).length > 5 ? balance.toFixed(5) : balance) || 0} {currency}</span>
          </div>
          <div styleName="currencyToggle">
            <Toggle onChange={this.handleInWalletChange} checked={this.isInWallet()} />
            <FormattedMessage id="Currency119" defaultMessage="Added to Wallet " />
          </div>
        </PageHeadline>
        <Table
          titles={['', '']}
          rows={this.getRows()}
          rowRender={(row, index) => (
            <Row key={index} {...row} />
          )}
        />
      </section>
    )
  }
}
