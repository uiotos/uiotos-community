var Ajax = {
    _createStandardXHR : function() {
        try {
            return new window.XMLHttpRequest();
        } catch( e ) {}
    },

    _createActiveXHR : function() {
        try {
            return new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch(e) {
            try {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch(e) {}
        }
    },

    // 取得 xhr 对象
    getXHR : function() {
        var loc;
        // #8138, IE may throw an exception when accessing
        // a field from window.location if document.domain has been set
        try {
            loc = location.href;
        } catch( e ) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            loc = document.createElement( "a" );
            loc.href = "";
            loc = loc.href;
        }
        var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
        var rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
        var locParts = rurl.exec( loc.toLowerCase() ) || [];
        var isLocal = rlocalProtocol.test(locParts[1]);

        var xhr = window.ActiveXObject ?
            /* Microsoft failed to properly
             * implement the XMLHttpRequest in IE7 (can't request local files),
             * so we use the ActiveXObject when it is available
             * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
             * we need a fallback.
             */
            (function() {
                return !isLocal && this._createStandardXHR() || this._createActiveXHR();
            }).bind(this) :
            // For all other browsers, use the standard XMLHttpRequest object
            this._createStandardXHR;
        return xhr();
    },

    _onreadystatechange : function(onload, onerror) {
        if (this.readyState === 4) {
            // everything is good, the response is received
            if (this.status === 200) {
                // perfect!
                onload(this.responseText);
            } else {
                // there was a problem with the request,
                // for example the response may contain a 404 (Not Found)
                // or 500 (Internal Server Error) response code
                if (onerror) onerror(this);
            }
        } else {
            // still not ready
        }
    },

    get : function(url, onload, onerror) {
       var xhr = this.getXHR();

       xhr.open('GET', url, true);
       xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");

       xhr.onreadystatechange = (function() {
           this._onreadystatechange.call(xhr, onload, onerror);
       }).bind(this);

       xhr.send();
   },

   // Post 请求
   post : function(url, data, onload, onerror) {
       var xhr = this.getXHR();

       xhr.open('POST', url, true);
       xhr.setRequestHeader("Content-Type","application/json");

       xhr.onreadystatechange = (function() {
           this._onreadystatechange.call(xhr, onload, onerror);
       }).bind(this);

       xhr.send(JSON.stringify(data));
   }
};
