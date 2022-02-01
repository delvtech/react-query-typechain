import { BigNumber, Contract, Signer } from "ethers";
import { QueryObserverResult, useQuery, UseQueryOptions } from "react-query";
import {
  EstimateGasMethodName,
  ContractMethodArgs,
  ContractMethodName,
} from "src/types";

export interface UseSmartContractEstimateGasOptions<
  TContract extends Contract,
  TMethodName extends EstimateGasMethodName<TContract>
> {
  callArgs?: ContractMethodArgs<TContract, TMethodName>;
  enabled?: boolean;
  staleTime?: number;
}

export function useSmartContractEstimateGas<
  TContract extends Contract,
  TMethodName extends EstimateGasMethodName<TContract>
>(
  // TODO: contracts should not be undefined thanks to tokenlist
  contract: TContract | undefined,
  methodName: TMethodName,
  signer: Signer | undefined,
  options: UseSmartContractEstimateGasOptions<TContract, TMethodName>
): QueryObserverResult<BigNumber> {
  const queryOptions = makeSmartContractEstimateGasUseQueryOptions(
    contract,
    methodName,
    signer,
    options
  );

  const queryResult = useQuery(queryOptions);

  return queryResult;
}

export function makeSmartContractEstimateGasUseQueryOptions<
  TContract extends Contract,
  TMethodName extends ContractMethodName<TContract>
>(
  contract: TContract | undefined,
  methodName: TMethodName,
  signer: Signer | undefined,
  options?: UseSmartContractEstimateGasOptions<TContract, TMethodName>
): UseQueryOptions<BigNumber> {
  const { enabled = true, callArgs, staleTime } = options || {};

  const queryOptions: UseQueryOptions<BigNumber> = {
    queryKey: makeSmartContractEstimateGasQueryKey<TContract, TMethodName>(
      contract?.address,
      methodName,
      callArgs
    ),
    queryFn: async (): Promise<BigNumber> => {
      const finalArgs = callArgs || [];

      // safe to cast the contract and signer, because we know it isn't
      // undefined thanks to the enabled option
      const result = await (contract as TContract)
        .connect(signer as Signer)
        .estimateGas[
          methodName as string // estimateGas isn't generic, so we must cast here
        ](...finalArgs);
      return result;
    },
    onError: () => {
      console.error(
        `Error calling estimateGas.${methodName} on ${contract?.address} with arguments:`,
        callArgs
      );
    },
    enabled: !!contract && !!signer && enabled,
  };

  if ("staleTime" in (options || {}) && Number.isFinite(staleTime)) {
    queryOptions.staleTime = staleTime as number;
  }

  return queryOptions;
}
export function makeSmartContractEstimateGasQueryKey<
  TContract extends Contract,
  TMethodName extends EstimateGasMethodName<TContract>
>(
  contractAddress: string | undefined,
  methodName: TMethodName,
  callArgs: Parameters<TContract["estimateGas"][TMethodName]> | undefined
): [
  string,
  TMethodName,
  string | undefined,
  {
    callArgs: Parameters<TContract["estimateGas"][TMethodName]> | undefined;
  }
] {
  return ["estimateGas", methodName, contractAddress, { callArgs }];
}
