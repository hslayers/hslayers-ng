// Dropable with the rest of AngularJS stuff
// Replaced by endpoints-with-datasources.pipe
export default () => {
  return (endpoints) => {
    return endpoints.filter((ep) => ep.type == 'layman');
  };
};
