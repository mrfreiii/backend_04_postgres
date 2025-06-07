export const convertObjectToQueryString = (
  queryParameters: Record<string, any>,
): string => {
  return queryParameters
    ? Object.entries(queryParameters).reduce((queryString, [key, val]) => {
        const symbol = queryString.length === 0 ? "?" : "&";

        queryString += `${symbol}${key}=${val.toString()}`;
        return queryString;
      }, "")
    : "";
};
