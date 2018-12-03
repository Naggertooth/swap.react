import React, { Component, Fragment } from 'react'

import Link from 'sw-valuelink'
import { links } from 'helpers'

import CSSModules from 'react-css-modules'
import styles from './PartialClosure.scss'

import { connect } from 'redaction'
import actions from 'redux/actions'
import { BigNumber } from 'bignumber.js'
import { Redirect } from 'react-router-dom'

import SelectGroup from './SelectGroup/SelectGroup'
import { Button, Toggle, Flip } from 'components/controls'
import Input from 'components/forms/Input/Input'
import Tooltip from 'components/ui/Tooltip/Tooltip'

import PageHeadline from 'components/PageHeadline/PageHeadline'
import InlineLoader from 'components/loaders/InlineLoader/InlineLoader'
import { FormattedMessage, injectIntl } from 'react-intl'

import config from 'app-config'


const filterIsPartial = (orders) => orders
  .filter(order => order.isPartialClosure)

@injectIntl
@connect(({ currencies, core: { orders } }) => ({
  currencies: currencies.items,
  orders: filterIsPartial(orders),
}))
@CSSModules(styles)
export default class PartialClosure extends Component {

  static defaultProps = {
    orders: [],
  }

  constructor() {
    super()

    this.state = {
      haveCurrency: 'btc',
      getCurrency: 'eth',
      haveAmount: 0,
      haveUsd: 0,
      getUsd: 0,
      getAmount: '',
      maxAmount: 0,
      peer: '',
      filteredOrders: [],
      isNonOffers: false,
      isFetching: false,
      isDeclinedOffer: false,
      customWalletUse: false,
      customWallet: '',
    }

    let timer
  }

  componentDidMount() {
    this.getUsdBalance()

    this.timer = setInterval(() => {
      this.setOrders()
    }, 2000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }
  shouldComponentUpdate(nextPros) {
    if (nextPros.orders && this.props.orders && nextPros.orders > 0) {
      if (nextPros.orders.length === this.props.orders.length) {
        return false
      }
    }
    return true
  }

  static getDerivedStateFromProps({ orders }, { haveCurrency, getCurrency }) {
    if (!Array.isArray(orders)) { return }

    const filteredOrders = orders.filter(order => !order.isMy
      && order.sellCurrency === getCurrency.toUpperCase()
      && order.buyCurrency === haveCurrency.toUpperCase())

    return {
      filteredOrders,
    }
  }

  getUsdBalance = async () => {
    const { haveCurrency, getCurrency } = this.state

    const exHaveRate = await actions.user.getExchangeRate(haveCurrency, 'usd')
    const exGetRate = await actions.user.getExchangeRate(getCurrency, 'usd')

    console.log('exHaveRate', exHaveRate)
    console.log('exGetRate', exGetRate)

    this.setState(() => ({
      exHaveRate,
      exGetRate,
    }))
  }

  sendRequest = () => {
    const {
      getAmount, haveAmount, haveCurrency, getCurrency,
      peer, orderId, customWalletUse, customWallet,
    } = this.state

    console.log('sendRequest', getAmount, peer, orderId, haveAmount)

    if (!String(getAmount) || !peer || !orderId || !String(haveAmount)) {
      return
    }

    const order = {
      buyCurrency: haveCurrency,
      sellCurrency: getCurrency,
      sellAmount: getAmount,
      buyAmount: haveAmount,
      destinationSellAddress: (customWalletUse && this.customWalletAllowed()) ? customWallet : null,
    }

    console.log('sendRequest order', order)

    this.setState(() => ({ isFetching: true }))

    actions.core.requestToPeer('request partial closure', peer, { order, orderId }, (orderId) => {
      console.log('orderId', orderId)
      // TODO change callback on boolean type
      if (orderId) {
        actions.core.sendRequest(orderId, (isAccept) => {
          if (isAccept) {
            this.setState(() => ({
              redirect: true,
              isFetching: false,
              orderId,
            }))
          } else {
            this.setDeclinedOffer()
          }
        })
      } else {
        this.setDeclinedOffer()
      }
    })
  }

  setDeclinedOffer = () => {
    this.setState(() => ({ haveAmount: '', isFetching: false, isDeclinedOffer: true }))

    setTimeout(() => {
      this.setState(() => ({
        isDeclinedOffer: false,
      }))
    }, 5000)
  }

  setNoOfferState = () => {
    this.setState(() => ({ isNonOffers: true }))
  }

  setAmountOnState = (maxAmount, getAmount) => {

    console.log('maxAmount', Number(maxAmount))
    console.log('getAmount', this.getFixed(getAmount))

    this.setState(() => ({
      maxAmount: Number(maxAmount),
      getAmount: this.getFixed(getAmount),
    }))

    return getAmount.isLessThanOrEqualTo(maxAmount)
  }

  getFixed = (value) => Number(value).toFixed(5)

  setAmount = (value) => {
    this.setState(() => ({ haveAmount: value, maxAmount: 0 }))
  }

  setOrders = async () => {
    const { filteredOrders, haveAmount, exHaveRate, exGetRate } = this.state

    if (filteredOrders.length === 0) {
      this.setNoOfferState()
      return
    }

    this.setState(() => ({
      isSearching: true,
    }))

    console.log('filteredOrders', filteredOrders)

    const sortedOrder = filteredOrders
      .sort((a, b) => Number(a.buyAmount.dividedBy(a.sellAmount)) - Number(b.buyAmount.dividedBy(b.sellAmount)))
      .map((item, index) => {

        const exRate = item.buyAmount.dividedBy(item.sellAmount)
        const getAmount = new BigNumber(String(haveAmount)).dividedBy(exRate)

        return {
          sellAmount: item.sellAmount,
          buyAmount: item.buyAmount,
          exRate,
          getAmount,
          orderId: item.id,
          peer: item.owner.peer,
        }
      })

    this.getUsdBalance()

    console.log('sortedOrder', sortedOrder)

    const search = await this.setOrderOnState(sortedOrder)

    console.log('search', search)

    if (search) {
      this.setState(() => ({
        isSearching: false,
      }))
    }
  }

  setOrderOnState = (orders) => {
    const { exHaveRate, exGetRate } = this.state
    const haveAmount = new BigNumber(this.state.haveAmount)

    console.log('setOrderOnState', orders)

    let maxAllowedSellAmount = new BigNumber(0)
    let maxAllowedGetAmount = new BigNumber(0)

    orders.forEach(item => {
      maxAllowedSellAmount = (maxAllowedSellAmount.isLessThanOrEqualTo(item.sellAmount)) ? item.sellAmount : maxAllowedSellAmount

      if (haveAmount.isLessThanOrEqualTo(item.buyAmount)) {
        console.log('item', item)
        maxAllowedGetAmount = (maxAllowedGetAmount.isLessThanOrEqualTo(item.getAmount)) ? item.getAmount : maxAllowedGetAmount
        const haveUsd = new BigNumber(String(exHaveRate)).multipliedBy(haveAmount)
        const getUsd  = new BigNumber(String(exGetRate)).multipliedBy(item.getAmount)

        this.setState(() => ({
          haveUsd: Number(haveUsd).toFixed(2),
          getUsd: Number(getUsd).toFixed(2),
          isNonOffers: false,
          peer: item.peer,
          orderId: item.orderId,
        }))
      } else {
        this.setState(() => ({
          isNonOffers: true,
          getUsd: Number(0).toFixed(2),
        }))
      }
    })

    const checkAmount = this.setAmountOnState(maxAllowedSellAmount, maxAllowedGetAmount)

    if (!checkAmount) {
      this.setNoOfferState()
    }
    return true
  }

  handleCustomWalletUse = () => {
    this.setState({
      customWalletUse: !this.state.customWalletUse,
    })
  }

  handleSetGetValue = ({ value }) => {
    let { getCurrency, haveCurrency } = this.state

    if (haveCurrency === value) {
      haveCurrency = getCurrency
    }

    this.setClearState()

    this.setState(() => ({
      haveCurrency,
      getCurrency: value,
    }))
  }

  handleSetHaveValue = ({ value }) => {
    let { getCurrency, haveCurrency } = this.state

    if (getCurrency === value) {
      getCurrency = haveCurrency
    }

    this.setClearState()

    this.setState(() => ({
      getCurrency,
      haveCurrency: value,
    }))
  }

  handleFlipCurrency = () => {
    this.setClearState()
    this.setState(() => ({
      haveCurrency: this.state.getCurrency,
      getCurrency: this.state.haveCurrency,
    }))
  }

  handlePush = () => {
    const { haveCurrency, getCurrency } = this.state
    this.props.history.push(`${haveCurrency}-${getCurrency}`)
  }

  setClearState = () => {
    this.setState(() => ({
      haveAmount: 0,
      haveUsd: 0,
      getUsd: 0,
      getAmount: '',
      maxAmount: 0,
      peer: '',
      isNonOffers: false,
      isFetching: false,
      isDeclinedOffer: false,
      customWalletUse: false,
      customWallet: '',
    }))
  }

  customWalletAllowed() {
    const { haveCurrency, getCurrency } = this.state

    if (haveCurrency === 'btc') {
      if (config.erc20[getCurrency] !== undefined) return true
    }

    return false
  }

  render() {
    const { currencies, intl: { locale } } = this.props
    const { haveCurrency, getCurrency, isNonOffers, redirect, orderId, isSearching,
      isDeclinedOffer, isFetching, maxAmount, customWalletUse, customWallet, getUsd, haveUsd,
    } = this.state

    const linked = Link.all(this, 'haveAmount', 'getAmount', 'customWallet')

    if (redirect) {
      return <Redirect push to={`/${locale}${links.swap}/${getCurrency}-${haveCurrency}/${orderId}`} />
    }

    const text = [
      <FormattedMessage id="partial223" defaultMessage="To change default wallet for buy currency. " />,
      <FormattedMessage id="partial224" defaultMessage="Leave empty for use Swap.Online wallet " />,
    ]

    return (
      <Fragment>
        <PageHeadline subTitle="Fast cryptocurrency exchange using atomicswap" />
        <div styleName="section">
          <div styleName="blockVideo">
            <iframe
              title="swap online video"
              width="560"
              height="315"
              src="https://www.youtube-nocookie.com/embed/Jhrb7xOT_7s?controls=0"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div styleName="block">
            <SelectGroup
              inputValueLink={linked.haveAmount.pipe(this.setAmount)}
              selectedValue={haveCurrency}
              onSelect={this.handleSetHaveValue}
              label={<FormattedMessage id="partial243" defaultMessage="You sell" />}
              placeholder="Enter amount"
              usd={haveUsd}
              currencies={currencies}
            />
            <p>
              <FormattedMessage id="partial221" defaultMessage="Max amount for offer: " />
              {maxAmount}{' '}{getCurrency.toUpperCase()}
            </p>
            <Flip onClick={this.handleFlipCurrency} styleName="flipButton" />
            <SelectGroup
              inputValueLink={linked.getAmount}
              selectedValue={getCurrency}
              onSelect={this.handleSetGetValue}
              label={<FormattedMessage id="partial255" defaultMessage="You get" />}
              disabled
              currencies={currencies}
              usd={getUsd}
            />
            {
              isSearching && (
                <span>
                  {` Wait search orders: `}
                  <InlineLoader />
                </span>
              )
            }
            <p>{`Max amount for offer:`} {maxAmount}{' '}{getCurrency.toUpperCase()}</p>
            {maxAmount > 0 && isNonOffers && (
              <p styleName="error">
                {`No orders found, try to reduce the amount`}
              </p>
            )}
            {
              this.customWalletAllowed() && (
                <Fragment>
                  <div styleName="walletToggle">
                    <Toggle checked={!customWalletUse} onChange={this.handleCustomWalletUse} />
                    <FormattedMessage id="partial244" defaultMessage=" Use Swap.Online wallet " />
                    <Tooltip text={text} id="Partial279" />
                  </div>
                  { customWalletUse && (
                    <div styleName="walletInput">
                      <Input valueLink={linked.customWallet} pattern="0-9a-zA-Z" placeholder="Enter the address of ETH wallet" />
                    </div>
                  ) }
                </Fragment>
              )
            }
            {isNonOffers &&
              (
                <p styleName="error">
                  <FormattedMessage id="partial277" defaultMessage="No offers" />
                </p>
              )
            }
            {isDeclinedOffer &&
              (
                <p styleName="error">
                  <FormattedMessage id="partial284" defaultMessage="Offer is declined" />
                </p>
              )
            }
            {
              isFetching && (
                <span>
                  <FormattedMessage id="partial291" defaultMessage="Wait participant: " />

                  <InlineLoader />
                </span>
              )
            }

            <div styleName="rowBtn">
              <Button styleName="button" brand onClick={this.sendRequest} disabled={isNonOffers}>
                {`Exchange now`}
              </Button>
              <Button styleName="button" gray onClick={this.handlePush} >
                {`Show order book`}
              </Button>
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}
