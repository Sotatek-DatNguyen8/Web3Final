import { useWeb3React } from "@web3-react/core";
import { useCallback } from "react";
import { queryGraph } from "./graph";

export const useQueryHistory = (orderBy, orderDirection) => {
  const { account } = useWeb3React();
  const orderByDefault = orderBy ? orderBy : "transactionTime";
  const directionDefault = orderDirection ? orderDirection : "desc";

  const queryHistory =
    Boolean(account) &&
    `{
        historyEntities(where: {user: "${account}"}, orderBy: ${orderByDefault}, orderDirection: ${directionDefault}) {
            id
            user
            eventName
            amount
            transactionTime
      }
    }`;

  const fetchData = useCallback(async () => {
    if (queryHistory) {
      const historyList = await queryGraph(queryHistory);

      return historyList;
    }
  }, [queryHistory]);

  return fetchData;
};
