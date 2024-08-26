window.htconfig = {
    Default: {
        convertURL: function(url) {
            var storagePrefix = '';
            if (storagePrefix && url && !/^data:image/.test(url) && !/^http/.test(url) && !/^https/.test(url)) {
                url = storagePrefix + '/' + url
            }
            // append timestamp
            url += (url.indexOf('?') >= 0 ? '&' : '?') + 'ts=' + Date.now();
            // append sid
            var match = window.location.href.match('sid=([0-9a-z\-]*)');
            if (match) {
                window.sid = match[1]
            }
            if(window.sid){
                url += '&sid=' + window.sid;
            }
            return url;
        }
    }
};
