import Web3Modal from "web3modal";
import {ethers} from "ethers";
import {Button, Card, Grid, Text} from "@nextui-org/react";
import { useEffect, useState} from "react";
import * as deployedAddresses from "../.config";
import Token from "../artifacts/contracts/Token.sol/Token.json";
import {Exchange} from "../typechain";

type ExchangeFromTokenNameType = (isChangingLiquidity: boolean, tokenName: string) => Promise<Exchange>
type RemoveLiquidityHandlerType = (liquidityPool: LiquidityPoolType) => void
type LiquidityPoolType = {
    'tokenName': string, 'ethAmount': string,
    'tokenAmount': string, 'lpTokenAmount': string
}

export default (props: {
    _getExchangeFromTokenName: ExchangeFromTokenNameType
    ,removeLiquidityHandler:  RemoveLiquidityHandlerType}) => {
    const [liquidityPools, setLiquidityPools] = useState<LiquidityPoolType[]>([])
    let [tokenSymbols, setTokenSymbols] = useState<string[]>([])
    let [cardText, setCardText] = useState<string>('')

    useEffect(() => {
        const setSymbols = async () => {
            const provider = new ethers.providers.AlchemyProvider('rinkeby')
            let firstToken = new ethers.Contract(deployedAddresses.FIRST_TOKEN, Token.abi, provider)
            let secondToken = new ethers.Contract(deployedAddresses.SECOND_TOKEN, Token.abi, provider)

            const firstTokenSymbol = await firstToken.symbol()
            const secondTokenSymbol = await secondToken.symbol()
            setTokenSymbols([firstTokenSymbol, secondTokenSymbol])
        }
        void setSymbols()

    }, [])

    useEffect(() => {
        if(tokenSymbols.length == 2) void getLiquidityPools()
    }, [tokenSymbols[0], tokenSymbols[1]])

    const getLiquidityPools = async () => {
        let liquidity_pools = []
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        let provider = new ethers.providers.Web3Provider(connection)
        let signer = provider.getSigner()
        let signerAddress = await signer.getAddress()
        const firstExchange = await props._getExchangeFromTokenName(false, tokenSymbols[0])
        const secondExchange = await props._getExchangeFromTokenName(false, tokenSymbols[1])
        let firstLpTokenAmount = ethers.utils.formatEther(await firstExchange.balanceOf(signerAddress))
        let secondLpTokenAmount = ethers.utils.formatEther(await secondExchange.balanceOf(signerAddress))
        if (parseFloat(firstLpTokenAmount) > 0) {
            let data = await firstExchange.getEthAndTokenByToken(ethers.utils.parseEther(firstLpTokenAmount))
            let ethAmount = ethers.utils.formatEther(data[0])
            let tokenAmount = ethers.utils.formatEther(data[1])
            let elem = {
                'tokenName': tokenSymbols[0], 'ethAmount': ethAmount,
                'tokenAmount': tokenAmount, 'lpTokenAmount': firstLpTokenAmount
            }
            liquidity_pools.push(elem)
        }
        if (parseFloat(secondLpTokenAmount) > 0) {
            let data = await secondExchange.getEthAndTokenByToken(ethers.utils.parseEther(secondLpTokenAmount))
            let ethAmount = ethers.utils.formatEther(data[0])
            let tokenAmount = ethers.utils.formatEther(data[1])
            let elem = {
                'tokenName': tokenSymbols[1], 'ethAmount': ethAmount,
                'tokenAmount': tokenAmount, 'lpTokenAmount': secondLpTokenAmount
            }
            liquidity_pools.push(elem)

        }
        if(liquidity_pools.length > 0) setLiquidityPools(liquidity_pools)
        else setCardText("You haven't added any liquidity")
    }

    const parseNum = (num: string) => {
        if (num.split('.')[1].length <= 5) return num
        let x = parseFloat(num)

        return x.toFixed(6)
    }

    return (
        <>
            {liquidityPools?.length > 0 ? (
                liquidityPools?.map((liquidityPool: LiquidityPoolType) => (
                    <Grid css={{'@lg': {ml: liquidityPools.length == 2 ? '0%':'25%'}}} key={liquidityPool['tokenName']}  sm={12} md={6}>
                        <Card hoverable color="primary">
                            <Text weight="bold" size={30} css={{textAlign: 'center', mb: '15%',
                                textGradient: "45deg, $blue500 -20%, $pink500 50%"
                            }}>
                                { liquidityPool['tokenName'] ?
                                    (liquidityPool['tokenName'] +  ' / ETH') : 'ETH'}
                            </Text>
                            <Text color="white" >
                                ETH: {parseNum(liquidityPool['ethAmount'])}
                            </Text>
                            <Text color="white">
                                {liquidityPool['tokenName']} : {parseNum(liquidityPool['tokenAmount'])}
                            </Text>
                            <Text color="white">
                                LPTokens: {parseNum(liquidityPool['lpTokenAmount'])}
                            </Text>
                            <Button onClick={() => props.removeLiquidityHandler(liquidityPool)} css={{mt: '15%'}}  color="secondary">Withdraw 🚀</Button>
                        </Card>
                    </Grid>
                ))
            ) : (
                <>
                    {cardText && (
                        <Card color="gradient">
                            <Text h1 size={40} color="white" css={{textAlign: 'center',

                            }}>
                                {cardText}
                            </Text>
                        </Card>
                    )}


                </>
            )
            }
        </>
    )
}