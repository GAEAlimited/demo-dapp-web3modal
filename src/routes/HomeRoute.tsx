import React, { useState, useEffect } from 'react'
import { Box, Button } from '~/style'

import { ethers } from 'ethers'
import { sequence } from '0xsequence'

import Web3Modal from 'web3modal'
import WalletConnect from '@walletconnect/web3-provider'

import { ERC_20_ABI } from '~/utils/abi'

import { configureLogger } from '@0xsequence/utils'
configureLogger({ logLevel: 'DEBUG' })

let providerOptions: any = {
  walletconnect: {
    package: WalletConnect,
    options: {
      infuraId: 'xxx-your-infura-id-here'
    }
  }
}

if (!window?.ethereum?.isSequence) {
  providerOptions = {
    ...providerOptions,
    sequence: {
      package: sequence,
      options: {
        appName: 'Web3Modal Demo Dapp',
        defaultNetwork: 'polygon'
      }
    }
  }
}

const web3Modal = new Web3Modal({
  providerOptions,
  cacheProvider: true
})

const HomeRoute = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>(null)

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet()
    }
  }, [])

  const connectWeb3Modal = async () => {
    if (web3Modal.cachedProvider) {
      web3Modal.clearCachedProvider()
    }
    connectWallet()
  };

  const connectWallet = async () => {
    const wallet = await web3Modal.connect()

    const provider = new ethers.providers.Web3Provider(wallet)
    
    if (wallet.sequence) {
      (provider as any).sequence = wallet.sequence
    }

    setProvider(provider)
  }

  const disconnectWeb3Modal = async () => {
    web3Modal.clearCachedProvider()
    
    if (provider && (provider as any).sequence) {
      const wallet = (provider as any).sequence as sequence.Wallet
      wallet.disconnect()
    }

    setProvider(null)
  }

  const getChainID = async () => {
    const signer = provider.getSigner()
    console.log('signer.getChainId()', await signer.getChainId())
  }

  const getAccounts = async () => {
    const signer = provider.getSigner()
    console.log('getAddress():', await signer.getAddress())

    console.log('accounts:', await provider.listAccounts())
  }

  const getBalance = async () => {
    const signer = provider.getSigner()
    const account = await signer.getAddress()
    const balanceChk1 = await provider.getBalance(account)
    console.log('balance check 1', balanceChk1.toString())

    const balanceChk2 = await signer.getBalance()
    console.log('balance check 2', balanceChk2.toString())
  }

  const getNetworks = async () => {
    console.log('networks:', await provider.getNetwork())
  }

  const signMessage = async () => {
    const signer = await provider.getSigner()

    const message = `Two roads diverged in a yellow wood,
Robert Frost poet

And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`

    // sign
    const sig = await signer.signMessage(message)
    console.log('signature:', sig)

    const isValid = await sequence.utils.isValidMessageSignature(
      await signer.getAddress(),
      message,
      sig,
      provider
    )
    console.log('isValid?', isValid)

  }

  const signTypedData = async () => {
    const signer = provider.getSigner()

    const typedData: sequence.utils.TypedData = {
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: await signer.getChainId(),
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
      },
      types: {
        'Person': [
          {name: "name", type: "string"},
          {name: "wallet", type: "address"}
        ]
      },  
      message: {
        'name': 'Bob',
        'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      }
    }    

    const sig = await signer._signTypedData(typedData.domain, typedData.types, typedData.message)
    console.log('signature:', sig)

    const isValid = await sequence.utils.isValidTypedDataSignature(
      await signer.getAddress(),
      typedData,
      sig,
      provider
    )
    console.log('isValid?', isValid)
  }

  const sendETH = async () => {
    const signer = provider.getSigner() // select DefaultChain signer by default

    console.log(`Transfer txn on ${signer.getChainId()}`)

    const toAddress = ethers.Wallet.createRandom().address

    const tx1 = {
      gasLimit: '0x55555',
      to: toAddress,
      value: ethers.utils.parseEther('1.234'),
      data: '0x'
    }

    console.log(`balance of ${toAddress}, before:`, await provider.getBalance(toAddress))

    const txnResp = await signer.sendTransaction(tx1)
    await txnResp.wait()

    console.log(`balance of ${toAddress}, after:`, await provider.getBalance(toAddress))
  }

  const sendDAI = async () => {
    const signer = provider.getSigner()

    const toAddress = ethers.Wallet.createRandom().address

    const amount = ethers.utils.parseUnits('5', 18)
    
    const daiContractAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' // (DAI address on Polygon)

    const tx = {
      gasLimit: '0x55555',
      to: daiContractAddress,
      value: 0,
      data: new ethers.utils.Interface(ERC_20_ABI).encodeFunctionData('transfer', [toAddress, amount.toHexString()])
    }

    const txnResp = await signer.sendTransaction(tx)
    await txnResp.wait()
  }

  const disableActions = !provider

  return (
    <Box sx={{
      width: '80%',
      textAlign: 'center',
      mx: 'auto',
      color: 'black',
      my: '50px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '10px' }}>Demo Dapp Web3Modal</h1>

      <p style={{ color: 'white', marginBottom: '14px', fontSize: '14px', fontStyle: 'italic' }}>Please open your browser dev inspector to view output of functions below</p>

      <p>
        <Button px={3} m={1} onClick={() => connectWeb3Modal()}>Connect Web3Modal</Button>
        <Button px={3} m={1} onClick={() => disconnectWeb3Modal()}>Disconnect</Button>
      </p>
      <br /> 
      <p>
        <Button disabled={disableActions} px={3} m={1} onClick={() => getChainID()}>ChainID</Button>
        <Button disabled={disableActions} px={3} m={1} onClick={() => getNetworks()}>Networks</Button>
        <Button disabled={disableActions} px={3} m={1} onClick={() => getAccounts()}>Get Accounts</Button>
        <Button disabled={disableActions} px={3} m={1} onClick={() => getBalance()}>Get Balance</Button>
      </p>
      <br />
      <p>
        <Button disabled={disableActions} px={3} m={1} onClick={() => signMessage()}>Sign Message</Button>
        <Button disabled={disableActions} px={3} m={1} onClick={() => signTypedData()}>Sign TypedData (EIP-712) Message</Button>
      </p>
      <br />
      <p>
        <Button disabled={disableActions} px={3} m={1} onClick={() => sendETH()}>Send ETH</Button>
        <Button disabled={disableActions} px={3} m={1} onClick={() => sendDAI()}>Send DAI Tokens</Button>
      </p>

    </Box>
  )
}

export default React.memo(HomeRoute)
