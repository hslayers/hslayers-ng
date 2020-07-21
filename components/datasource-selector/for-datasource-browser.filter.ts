export const HsForDatasourceBrowserFilter = () => {
  return (endpoints) => {
    return endpoints.filter((ep) => ep.type != 'statusmanager');
  };
};
