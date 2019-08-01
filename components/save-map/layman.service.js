export default ['Core', 'hs.utils.service', '$http', 'config',
    function (Core, utils, $http, config) {
        var me = this;
        angular.extend(me, {
            save(compositionJson, endpoint, compoData) {
                return new Promise((resolve, reject) => {
                    var formdata = new FormData();
                    formdata.append('file',
                        new Blob([JSON.stringify(compositionJson)],
                            { type: 'application/json' }), 'blob.json'
                    );
                    formdata.append('name', compoData.title);
                    formdata.append('title', compoData.title);
                    formdata.append('abstract', compoData.abstract);
                    $http({
                        url: `${endpoint.url}/rest/${endpoint.user}/maps?${Math.random()}`,
                        method: 'POST',
                        data: formdata,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    })
                        .then(function (response) {
                            resolve(response)
                        }, function (err) {
                            reject()
                        });
                })
            }
        });
        return me;
    }]