import { ApolloClient, InMemoryCache } from "@apollo/client";
import { gql } from "@apollo/client";
import { REACT_APP_GRAPHQL_URI } from "utils/connect";

export const client = new ApolloClient({
  uri: REACT_APP_GRAPHQL_URI,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
  },
});

export const queryGraph = async (query) => {
  return new Promise((resolve, reject) => {
    try {
      client
        .query({
          query: gql`
            ${query}
          `,
        })
        .then((result) => {
          resolve(result);
        });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
