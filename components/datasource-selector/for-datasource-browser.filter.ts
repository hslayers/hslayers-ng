export default () => {
  return (endpoints) => {
    return endpoints.filter((ep) => ep.type != 'statusmanager');
  };
};
