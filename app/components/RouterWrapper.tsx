import { useState, useCallback } from 'react';
import { Coin } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import BigNumber from 'bignumber.js';

type SwapOperation = {
  oro_swap: {
    offer_asset_info: {
      native_token?: { denom: string };
      token?: { contract_addr: string };
    };
    ask_asset_info: {
      native_token?: { denom: string };
      token?: { contract_addr: string };
    };
    pair_type: Record<string, unknown>;
    pair_address: string;
  };
};

type RouterWrapperConfig = {
  routerAddress: string;
  treasuryAddress: string;
  multiHopFeeRate: string;
  singleHopFeeRate: string;
  chainId: string;
  rpcUrl: string;
};

interface ExecuteSwapResult {
  transactionHash: string;
  fee: string;
  treasuryAmount: string;
};

type SwapAsset = {
  type: 'native' | 'cw20';
  denom?: string;
  contract?: string;
  decimals: number;
};

export const useRouterWrapper = (config: RouterWrapperConfig) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate the fee for a swap operation
  const calculateFee = useCallback(
    async (operations: SwapOperation[], offerAmount: string): Promise<{ fee: string; totalCost: string }> => {
      const isMultiHop = operations.length > 1;
      const feeRate = parseFloat(isMultiHop ? config.multiHopFeeRate : config.singleHopFeeRate);
      
      // Ensure the fee rate is a valid number between 0 and 1
      if (isNaN(feeRate) || feeRate < 0 || feeRate > 1) {
        throw new Error('Invalid fee rate');
      }
      
      const amount = BigInt(offerAmount);
      const feeAmount = (amount * BigInt(Math.floor(feeRate * 10000))) / BigInt(10000);
      
      return {
        fee: feeAmount.toString(),
        totalCost: (amount + feeAmount).toString(),
      };
    },
    [config.multiHopFeeRate, config.singleHopFeeRate]
  );

  // Execute a swap through the router wrapper
  const executeSwap = useCallback(
    async (
      client: SigningCosmWasmClient,
      senderAddress: string,
      operations: SwapOperation[],
      offerAmount: string,
      offerAsset: { type: 'native' | 'cw20'; denom?: string; contract?: string },
      minimumReceive: string,
      maxSpread: string,
      memo = ''
    ): Promise<ExecuteSwapResult> => {
      try {
        setLoading(true);
        setError(null);

        // Calculate the fee for the transaction
        const { fee: feeAmount } = await calculateFee(operations, offerAmount);
        
        // The swap message that will be executed by the router contract
        const swapMsg = {
          execute_swap_operations: {
            operations: operations,
            offer_amount: '0', // Will be set based on token type
            minimum_receive: minimumReceive,
            max_spread: maxSpread,
            to: senderAddress,
          },
        };

        // For native tokens, we need to send the tokens as funds
        if (offerAsset.type === 'native' && offerAsset.denom) {
          const { coins } = await import("@cosmjs/stargate");
          
          // Set the actual offer amount in the message
          swapMsg.execute_swap_operations.offer_amount = offerAmount;
          
          console.log('Executing native token swap with message:', JSON.stringify(swapMsg, null, 2));
          
          // Send the tokens as funds with the execute message
          const funds = coins(offerAmount, offerAsset.denom);
          const fee = {
            amount: [],
            gas: '500000',
          };
          
          console.log('Sending funds:', funds, 'for swap amount:', offerAmount);
          
          // Execute the swap through the router wrapper
          const tx = await client.execute(
            senderAddress,
            config.routerAddress,
            swapMsg,
            fee,
            memo,
            funds
          );
          
          // Calculate treasury amount (1% of the swap amount)
          const treasuryAmount = new BigNumber(offerAmount).multipliedBy(0.01).toFixed(0);
          
          return { 
            transactionHash: tx.transactionHash, 
            fee: feeAmount,
            treasuryAmount: treasuryAmount
          };
          
        } else if (offerAsset.type === 'cw20' && offerAsset.contract) {
          // For CW20 tokens, we need to send the tokens to the router first
          
          // Set the actual offer amount in the message
          swapMsg.execute_swap_operations.offer_amount = offerAmount;
          
          const sendMsg = {
            send: {
              contract: config.routerAddress,
              amount: offerAmount,
              msg: btoa(JSON.stringify(swapMsg.execute_swap_operations)),
            },
          };
          
          // Set a default fee for CW20 tokens
          const fee = {
            amount: [],
            gas: '700000', // Slightly higher gas limit for CW20
          };
          
          console.log('Executing CW20 token swap with message:', JSON.stringify(sendMsg, null, 2));
          
          // Execute the send message to the CW20 contract
          const tx = await client.execute(
            senderAddress,
            offerAsset.contract,
            sendMsg,
            fee,
            memo
          );
          
          // Calculate treasury amount (1% of the swap amount)
          const treasuryAmount = new BigNumber(offerAmount).multipliedBy(0.01).toFixed(0);
          
          return { 
            transactionHash: tx.transactionHash, 
            fee: feeAmount,
            treasuryAmount: treasuryAmount
          };
          
        } else {
          throw new Error('Invalid token type or missing required fields');
        }
      } catch (error) {
        console.error('Router wrapper error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [calculateFee, config.routerAddress]
  );

  return {
    executeSwap,
    calculateFee,
    loading,
    error,
  } as UseRouterWrapperReturn;
};

// Type for the swap operation result
interface SwapOperationResult {
  transactionHash: string;
  fee: string;
  treasuryAmount: string;
};

// Type for the router wrapper return values
type UseRouterWrapperReturn = {
  executeSwap: (
    client: SigningCosmWasmClient,
    senderAddress: string,
    operations: SwapOperation[],
    offerAmount: string,
    offerAsset: { type: 'native' | 'cw20'; denom?: string; contract?: string },
    minimumReceive: string,
    maxSpread: string,
    memo?: string
  ) => Promise<SwapOperationResult>;
  calculateFee: (operations: SwapOperation[], offerAmount: string) => Promise<{ fee: string; totalCost: string }>;
  loading: boolean;
  error: string | null;
};
