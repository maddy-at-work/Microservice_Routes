(function () {
    'use strict';

    // This config stores the important strings needed to
    // connect to the MS API and OAuth service to
    // gain authorization that we then exchange for an access  
    // token.
    //
    // Do not store your client secret here. 
    // We are using a server-side OAuth flow, and the client 
    // secret is kept on the web server. 
    var config = {
        clientId: 'YOUR_CLIENT_ID',
        redirectUri: 'http://localhost:3333',
        authUrl: 'https://openair-california.airtrfx.com/route-service/v3/nh/routes/source/TRFX',
        version: '2021.05.01'
    };
    //  more code goes here

    // This function parses the access token in the URI if available
    // It also adds a link to the connect button
    $(document).ready(function () {
        //      var accessToken = Cookies.get("accessToken");
        //      var hasAuth = accessToken && accessToken.length > 0;
        //      updateUIWithAuthState(hasAuth);

        updateUIWithAuthState(true);

        $("#connectbutton").click(function () {
            //          doAuthRedirect();
        });

        $("#getvenuesbutton").click(function () {
            console.log("#getvenuesbutton.click()");
            tableau.connectionName = "MS Route [V3]";
            tableau.submit();
        });
    });

    // An on-click function for the connect button,
    // This will redirect the user to a MS login
    function doAuthRedirect() {
        var appId = config.clientId;
        if (tableau.authPurpose === tableau.authPurposeEnum.ephemerel) {
            appId = config.clientId;  // This should be Desktop
        } else if (tableau.authPurpose === tableau.authPurposeEnum.enduring) {
            appId = config.clientId; // This should be the Tableau Server appID
        }

        var url = config.authUrl + 'oauth2/authenticate?response_type=code&client_id=' + appId +
            '&redirect_uri=' + config.redirectUri;
        window.location.href = url;
    }
    
    /*

    //------------- OAuth Helpers -------------//
    // This helper function returns the URI for the venueLikes endpoint
    // It appends the passed in accessToken to the call to personalize the call for the user
    function getVenueLikesURI(accessToken) {
        return "https://api.foursquare.com/v2/users/self/venuelikes?oauth_token=" +
            accessToken + "&v=" + config.version;
    }*/

    // This function toggles the label shown depending
    // on whether or not the user has been authenticated
    function updateUIWithAuthState(hasAuth) {
        console.log("updateUIWithAuthState: " + hasAuth);

        if (hasAuth) {
            $(".notsignedin").css('display', 'none');
            $(".signedin").css('display', 'block');
        } else {
            $(".notsignedin").css('display', 'block');
            $(".signedin").css('display', 'none');
        }
    }

    //------------- Tableau WDC code -------------//
    // Create tableau connector, should be called first
    var myConnector = tableau.makeConnector();

    // Init function for connector, called during every phase but
    // only called when running inside the simulator or tableau
    myConnector.init = function (initCallback) {
        tableau.authType = tableau.authTypeEnum.custom;

        // If we are in the auth phase we only want to show the UI needed for auth
        if (tableau.phase == tableau.phaseEnum.authPhase) {
            $("#getvenuesbutton").css('display', 'none');
        }

        if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
            // If API that WDC is using has an endpoint that checks
            // the validity of an access token, that could be used here.
            // Then the WDC can call tableau.abortForAuth if that access token
            // is invalid.
            tableau.submit()

        }

        //var accessToken = Cookies.get("accessToken");
        //console.log("Access token is '" + accessToken + "'");
        //var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;
        //updateUIWithAuthState(hasAuth);

        var hasAuth = true;
        updateUIWithAuthState(true);

        initCallback();

        // If we are not in the data gathering phase, we want to store the token
        // This allows us to access the token in the data gathering phase
        /*
        if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
            if (hasAuth) {
                tableau.password = accessToken;
  
                if (tableau.phase == tableau.phaseEnum.authPhase) {
                  // Auto-submit here if we are in the auth phase
                  tableau.submit()
                }
  
                return;
            }
        }*/

        if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
            if (hasAuth) {
                //tableau.password = ;
                
                //if (tableau.phase == tableau.phaseEnum.authPhase) {
                    // Auto-submit here if we are in the auth phase
                    tableau.submit()
                //}

                return;
            }
        }
    };

    // Declare the data to Tableau that we are returning from MS
    myConnector.getSchema = function (schemaCallback) {
        var schema = [];

        var col1 = { id: "createdDate", dataType: "string", alias: '__createdat' };
        var col2 = { id: "origin", dataType: "string", alias: 'departureairportiatacode'};
        var col3 = { id: "destination", dataType: "string", alias: 'arrivalairportiatacode' };
        var col4 = { id: "source", dataType: "string", alias: 'datasource' };
        var cols = [col1, col2, col3, col4];

        var tableInfo = {
            id: "MSRouteTable",
            alias:"V3-Routes",
            columns: cols
        }

        schema.push(tableInfo);

        schemaCallback(schema);
    };

    // This function actually make the API call and
    // parses the results and passes them back to Tableau
    myConnector.getData = function (table, doneCallback) {
        console.log("Iteration #2");

        var dataToReturn = [];

        //var accessToken = tableau.password;
        //var connectionUri = getVenueLikesURI(accessToken);

        var xhr = $.ajax({
            //url: connectionUri,
            headers: {
                'EM-API-Key': 'rClgeTw1LnvMAlvEg5KZv5mMGK2qAU0x5o6KlxK3EPRhIBjK0TLNv48wZAyZ1AfF'
            },
            url: "https://openair-california.airtrfx.com/route-service/v3/ua/routes/source/TRFX",
            dataType: 'json',
            success: function (data) {
                if (data != null && Array.isArray(data)) {
                    var i = 0;
                    for (i = 0; i < data.length; i++) {
                        var route = {
                            'createdDate': data[i].createdDate,
                            'origin': data[i].origin,
                            'destination': data[i].destination,
                            'source': data[i].source
                        };
                        dataToReturn.push(route);
                    }

                    table.appendRows(dataToReturn);
                    doneCallback();
                } else {
                    tableau.abortWithError("No results found");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                // WDC should do more granular error checking here
                // or on the server side. 
                tableau.abortForAuth("Invalid Access Token");
            }
        });
    };

    // Register the tableau connector, call this last
    tableau.registerConnector(myConnector);


})();// JavaScript source code
