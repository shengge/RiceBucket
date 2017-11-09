var LTCJaxxCustomRelay = function() {
    this._baseUrl = "https://api.jaxx.io/api/ltc/";
    //this._baseUrl = "https://api.jaxx.io/api/ltc/";
    this._getTxListPrepend = 'transactions/';
    this._getTxListAppend = '';
    this._getTxDetailsPrepend = 'transactionParams/';
    this._getTxDetailsAppend = '';
    this._getAccountBalancePrepend = 'balance/';
    this._getAccountBalanceAppend = '';
    this._getUTXOPrepend = 'transactionParams/';
    this._name = "Jaxx Litecoin Custom API";
    this._reliable = "true";
    this._lastBlock = 0;
    this._relayManager = null;
    this._fixedBlockHeight = false;
    this._getUTXOAppend = '?includeUnconfirmed=true';
}

LTCJaxxCustomRelay.prototype.initialize = function(relayManager) {
    this._relayManager = relayManager;
}

LTCJaxxCustomRelay.prototype.getLastBlockHeight = function(){
	// This function shares a common interface with the other relays.
	return this._lastBlock;
}

LTCJaxxCustomRelay.prototype.setLastBlockHeight = function(newHeight){
	if (this._fixedBlockHeight){
        this._lastBlock = this._fixedBlockHeight;
    } else {
        this._lastBlock = newHeight;
    }
}

LTCJaxxCustomRelay.prototype.fetchLastBlockHeight  = function(callback, passthroughParams) {
    var self = this; // For references inside the callback function.
	this._relayManager.relayLog("Fetching the block height for " + this._name);
    RequestSerializer.getJSON(this._baseUrl + 'blockchainInfo', function (response, status, passthroughParams) {
        if (status === 'error'){
            self._relayManager.relayLog("Chain Relay :: No connection with " + self._name + ". Setting height to 0");
            if (self._fixedBlockHeight) {
                self._lastBlock = self._fixedBlockHeight;
            } else {
                self._lastBlock = 0;
            }
        }
        else {
            //this._lastBlock = response.blockcount;
            //self._relayManager.relayLog("Chain Relay :: Updated blockrexplorer.com height: " + this._lastBlock);
            self.setLastBlockHeight(response.height);
            self._relayManager.relayLog("Chain Relay :: Updated " + self._name + " :: blockheight :: " + self.getLastBlockHeight()); // We cannot use 'this' since the function is contained inside a callback.
        }
        
        callback(status, passthroughParams);
    }, true, passthroughParams);
}

LTCJaxxCustomRelay.prototype.checkCurrentHeightForAnomalies  = function() {
    if(this._lastBlock ==0 || typeof this._lastBlock == "undefined"){
        this._reliable=false;
    } 
    else{
        this._reliable=true;
    }  
}

//@note: @here: this is using insight.io, which has the issue with the transactions not being associated to the proper addresses if using multiple.

LTCJaxxCustomRelay.prototype.getTxList  = function(addresses, callback, passthroughParams) {


    var self = this;

    var urlUnconfirmed = this._baseUrl + 'unconfirmedTransactions/'+addresses;

    var requestString = this._baseUrl + this._getTxListPrepend + addresses + this._getTxListAppend;

    RequestSerializer.getJSON(requestString, function(response1, status1, passthroughParams) {
        var returnTxList = null;


        if(status==='error'){
            callback(status1, {}, passthroughParams);

            self._relayManager.relayLog("Chain Relay :: Cannot get txList : No connection with "+ this._name);
        }
        else {


            RequestSerializer.getJSON(urlUnconfirmed,function (response2, status2, passthroughParams) {

                if(status2==='error' ){
                    callback('error', {}, passthroughParams);
                }else{
                    var out = [];
                    for(var str in response1 ){
                        response1[str] = response1[str].map(function (hash) {
                            return {txHash:hash}
                        })
                        if(response2[str]) {
                            response2[str] = response2[str].map(function (hash) {
                                return {txHash:hash}
                            })
                        }

                        var item = {
                            address:str,
                            txs:response1[str]
                        }
                        var item2 = response2[str];
                        if(Array.isArray(item2)){
                            if(item2.length) item.txs =  item.txs.concat(item2);

                        }else console.warn('unconfirmed respond failed for  ' + str);
                        out.push(item);
                    }


                    //  returnTxList = self.getTxListParse(response1);

                  /*  console.warn(requestString);
                   console.warn(urlUnconfirmed);
                   console.warn(response1);
                   console.warn(response2);

                    console.warn({data:out});*/
                    // console.warn(returnTxList);

                    callback('success', {data:out}, passthroughParams);
                }

            }, true, passthroughParams);
            //self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx List Raw response:" + JSON.stringify(response));


//            console.log(passthrough.response)
        }



    }, true, passthroughParams);


    /*// g_JaxxApp.getLitecoinRelays().getRelayByIndex(0).getTxList("LhGYSWAabViCqsLiGKCwND7aC1yDC9TApd,LYsBRZqfme1hjTYPnxEm8hpYJaDZYZrky8", function(){console.log(arguments);}, "PassThrough"); // test case 1
    this._relayManager.relayLog("Chain Relay :: " + this._name+ " - Requested txlist for " + addresses);
    
    var self = this;
    
    //var passthroughAddresses = {addresses: addresses};
    
    var requestString = this._baseUrl + this._getTxListPrepend + addresses + this._getTxListAppend;
    
    this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);

    RequestSerializer.getJSON(requestString, function(response, status, passthroughParams) {
        var returnTxList = null;
        
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get txList : No connection with "+ this._name);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx List Raw response:" + JSON.stringify(response));
                        
            returnTxList = self.getTxListParse(response);
//            console.log(passthrough.response)
        }
        
        callback(status, returnTxList, passthroughParams);
    }, true, passthroughParams);
    */


}



LTCJaxxCustomRelay.prototype.getTxListParse = function(primaryTxListData) {
    var returnData = {data: []};
    
    var allKeys = Object.keys(primaryTxListData);
    
    var txListForAddresses = [];

    for (var i = 0; i < allKeys.length; i++) {
        var sourceTxs = primaryTxListData[allKeys[i]];
        var targetTxs = [];
        for (var j = 0; j < sourceTxs.length; j++){
            targetTxs.push({"txHash" : sourceTxs[j]});
        }
        var newTxList = {
            address: allKeys[i],
            txs: targetTxs,
            unconfirmed: {}
        };
        
        txListForAddresses.push(newTxList);
    }
    
    returnData.data = txListForAddresses;
    
    return returnData;
}

LTCJaxxCustomRelay.prototype.getTxCount = function(addresses, callback, passthroughParams) {
    var self = this;
    
    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: requested txCount for :: " + addresses);
    
    var requestString = this._baseUrl + 'transactions/' + addresses;
    
    this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);

    RequestSerializer.getJSON(requestString, function (response,status, passthroughParams) {
        var txCount = -1;
        
        if (status === 'error') {
            self._relayManager.relayLog("Chain Relay :: Cannot get txCount : No connection with " + self._name);
        } else {
            txCount = 0;
            
            var allKeys = Object.keys(response);
            
            for (var i = 0; i < allKeys.length; i++) {
                var allTxKeys = Object.keys(response[allKeys[i]]);
                
                txCount += allTxKeys.length;
            }
//            console.log("found :: " + JSON.stringify(response));
        }
        
        //@note: @here: @todo: get unconfirmed tx?
        ///api/ltc/unconfirmedTransactions/LhGYSWAabViCqsLiGKCwND7aC1yDC9TApd,LYsBRZqfme1hjTYPnxEm8hpYJaDZYZrky8

        callback(status, txCount, passthroughParams);
    },true, passthroughParams);    
}

LTCJaxxCustomRelay.prototype.getTxDetails = function(txHashes, callback, passthroughParams) {

//    console.log("LTCJaxxCustomRelay :: getTxDetails :: currently unimplemented");
    var self = this;

    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: requested tx details for :: " + txHashes);

    //var txDetailsStatus = {numHashesTotal: txHashes.length, numHashesProcessed: 0, allHashes: txHashes, numHashRequestsSucceeded: 0, allTxDetails: []};

    var requestString = this._baseUrl + 'transactionInfo/' + txHashes.join(',');
    // Sample requestString: https://api.jaxx.io/api/ltc/transactionInfo/3b40250a08e7cb493981adfc6637235835998347e059565eb24f9d6268cea70f,9f4da4554f02c209e98040cc478720c922b50edb14f4071f8c4c73e74a9243bf

    RequestSerializer.getJSON(requestString, function (response, status) {
        var callbackData = [];
        if (status === 'error'){

        } else {
            callbackData = self.getTxDetailsParse(response);
        }
        
        callback(status, callbackData, passthroughParams);
    });
}

LTCJaxxCustomRelay.prototype.getTxDetailsParse = function(response) {
    
//{
//    "1df9a5db8f3dbeac96d3b20cab807634b34ecea5915d5dbdadca95b1c8ec8c41": {
//        "hash": "1df9a5db8f3dbeac96d3b20cab807634b34ecea5915d5dbdadca95b1c8ec8c41",
//        "vin": [],
//        "vout": [
//            {
//                "standard": true,
//                "address": "LMTGkzHF6d2HpKrcoGGqrAMtKpDBLmUhRs",
//                "value": "50",
//                "spent": true
//            }
//        ],
//        "blockheight": 124,
//        "time_utc": "2011-10-13T03:07:20.000Z",
//        "standard": false,
//        "confirmations": 1079282
//    },
//        "caaeb42a2367f9d0dcd5bfdb6d90fb7d9fef0bffbf147a9775a0f5d831e4b780": {
//        "hash": "caaeb42a2367f9d0dcd5bfdb6d90fb7d9fef0bffbf147a9775a0f5d831e4b780",
//        "vin": [
//            {
//                "address": "LNDfDcG5hDwqXSMo6nK8RdfvtUegSD3mqi",
//                "amount": "-12.29454249",
//                "previousTxId": "ee67e7fcc582503082d69dcb625a583b5c21c55cd62b6db89e157d9ee2e2dfad",
//                "previousIndex": 1,
//                "standard": true
//            }
//        ],
//        "vout": [
//            {
//                "standard": true,
//                "address": "LTvsAa42uedYggGnHP5Zk3tZ91jXuws6rL",
//                "value": "1.27889497",
//                "spent": true
//            },
//            {
//                "standard": true,
//                "address": "LQquUJvPFoKzM8PozDRA7edcZvSpxbGmZm",
//                "value": "11.01464752",
//                "spent": true
//            }
//        ],
//        "blockheight": 1078431,
//        "time_utc": "2016-10-12T19:30:32.000Z",
//        "confirmations": 975
//    }
//}
    
    var allTxDetails = [];
    
    var allAddressData = response;
    
    var addressKeys = Object.keys(response);
    
    for (var idx = 0; idx < addressKeys.length; idx++) {
        var curAddress = addressKeys[idx];
        
        var curData = response[curAddress];
        
        
        var outputs = [];
        var inputs = [];

        for (i = 0; i < curData.vout.length; i++) {
            var output = curData.vout[i];

            outputs.push({
                address: output.address,
                amount: parseFloat(output.amount).toFixed(8), 
                index: i, 
                spent: output.spent,
                standard: output.standard
            });
        }

        for (i = 0; i < curData.vin.length; i++) {
            var input = curData.vin[i];

            inputs.push({
                address: input.address,
                //@note: @here: @todo: balance calculation bug?
                amount: parseFloat(input.amount).toFixed(8),
                index: i, 
                previousTxId: input.previousTxId,
                previousIndex: input.previousIndex,
                standard: input.standard
            })
        }

        var timestamp =  new Date(curData.time_utc).getTime() / 1000.0;
        if(isNaN(timestamp)) timestamp = Math.round(Date.now()/1000);

        var tx = {
            txid: curData.hash,
            block: curData.height,
            confirmations: curData.confirmations,
            time_utc: timestamp,
            inputs: inputs,
            outputs: outputs
        }
        
        allTxDetails.push(tx);
    }

    return allTxDetails;
}

//LTCJaxxCustomRelay.prototype.getAddressBalance = function(address, callback, passthroughParams) {
//    // @TODO: Program Blockr and Custom Relay for multiple addresses
//    var self = this;
//    
//    var requestString = this._baseUrl + 'balance/' + address; 
//    // https://api.jaxx.io/api/ltc/balance/LhGYSWAabViCqsLiGKCwND7aC1yDC9TApd,LYsBRZqfme1hjTYPnxEm8hpYJaDZYZrky8 
//    
//    RequestSerializer.getJSON(requestString, function (response,status) {
//        var balance = -1;
//
//        if(status==='error'){
//            self._relayManager.relayLog("Chain Relay :: Cannot get address balance : No connection with "+ self._name);
//        } else {
//            self._relayManager.relayLog("Chain Relay :: " + self._name + " Address Balance Raw response:"+JSON.stringify(response));
//
//            balance = parseInt(response[Object.keys(response)[0]].confirmed.amount);
//        }
//
//        callback(status, balance, passthroughParams);
//    });
//}

//LTCJaxxCustomRelay.prototype.getFixedBlockHeight = function( address, callback, passthroughParams) {
//    var self = this;
//    
//    var requestString = this._baseUrl + 'api/txs/?address=' + address;
//    
//    RequestSerializer.getJSON(requestString, function (response,status) {
//        if(status==='error'){
//            self._relayManager.relayLog("Chain Relay :: Cannot get Tx Block Height : No connection with "+ self._name);
//        } else {
//            var setBlockHeight = response.txs[1].blockheight;
//            
//            self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx Block Height Raw response:"+JSON.stringify(setBlockHeight));
//            
//            callback(setBlockHeight, passthroughParams);
////            console.log(self._name + "  :: " + setBlockHeight);
//        }
//    });    
//}

LTCJaxxCustomRelay.prototype.getUTXO = function(addresses, callback, passthroughParams) {
    if (!callback) { 
        throw new Error('missing callback'); 
    }
    
    var url = this._baseUrl + this._getUTXOPrepend + addresses + this._getUTXOAppend; 
    this._relayManager.relayLog("Chain Relay :: " + this._name+" - Requested UTXO for "+addresses + " :: url :: " + url);
	var self = this;
    // Requests:
    // https://api.jaxx.io/api/ltc/transactionParams/LcFAosSLzy9TuRRedcLVriVd8938P2o69p,LeL16MDWU5jS3oeHHwEZRBTDExwPbNgcvy,LUnWaHtvTBbTmJ5ycM9XJP1DohAg3h9gHF // 1
    RequestSerializer.getJSON(url, function (response,status, passthroughParams) {
        // JSON.stringify(response) results
        // "{"LcFAosSLzy9TuRRedcLVriVd8938P2o69p":[],"LeL16MDWU5jS3oeHHwEZRBTDExwPbNgcvy":[],"LUnWaHtvTBbTmJ5ycM9XJP1DohAg3h9gHF":[{"txhash":"414b0a723b5e17aed3a1a87a4e35f14794b541ee107101b3ac46331c61f6cc8f","vout":0,"amount":"0.00021082","hex":"76a91468e16a50448dd0f863a9e82bab57951fc74aef6e88ac"}]}" // 1
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get UTXO: No connection with "+ self._name);
            callback(new Error("Chain Relay :: Cannot get txCount: No connection with " + self._name));
        }
        else if(response){
            //self._relayManager.relayLog("Chain Relay :: " + btcRelays.blockexplorer.name+" UTXO Raw :"+JSON.stringify(response));
            /*
            var unspent = [];

            for(i=0;i<response.length;i++){
                var tempRemote = response[i];

                var tempTx = { tx: tempRemote.txid , amount: tempRemote.amount, n: tempRemote.vout, confirmations: tempRemote.confirmations };
                unspent[i] = tempTx;
            }
            var dataToReturn = {data : { unspent: unspent}};
            */
            dataToReturn = self.getUTXOParse(response);
            self._relayManager.relayLog("Chain Relay :: " + self._name + " UTXO minified :" + JSON.stringify(dataToReturn));
            callback("success", dataToReturn, passthroughParams);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " : Cannot get UTXO. ");
            callback(new Error("Chain Relay :: " + self._name + " : Cannot get UTXO. "), "", passThroughParams);
        }
    },true, passthroughParams);
}

LTCJaxxCustomRelay.prototype.getUTXOParse = function(response){
    returnData = {};
    var addresses = Object.keys(response);
    for (var i = 0; i < addresses.length; i++){
        var returnTransactions = [];
        var transactionData = response[addresses[i]];
        for (var j = 0; j < transactionData.length; j++){
            var sourceTransaction = transactionData[j];
            var targetTransaction = {};
            targetTransaction['txid'] = sourceTransaction['txhash'];
            targetTransaction['amount'] = parseFloat(sourceTransaction['amount']).toFixed(8);
            targetTransaction['index'] = sourceTransaction['vout'];
            returnTransactions.push(targetTransaction);
        }
        returnData[addresses[i]] = returnTransactions;
    }
    return returnData;
}

LTCJaxxCustomRelay.prototype.pushRawTx  = function(hex, callback) {
    var requestString = this._baseUrl + 'rawTransaction'; 
    
    this._relayManager.relayLog("Chain Relay :: " + this._name + " pushing raw tx : " + hex);
    
    $.ajax(requestString, {
        complete: function(ajaxRequest, status) {
			var response;
			var responseText;
            if (status === 'success') {
                response = '{"status": "success"}';
            }
            else {
				responseText = JSON.stringify(ajaxRequest.responseText)
                response = '{"status": "fail" , "message": ' + responseText + '}';
            }
			callback(status, JSON.parse(response));
        },
        contentType: 'application/x-www-form-urlencoded',
        data: "transaction="+ hex,
        type: 'PUT'
    });
}

// *******************************************************
// Some test stubs:
// *******************************************************

LTCJaxxCustomRelay.prototype.getRelayType = function() {
    return 'LTCJaxxCustomRelay';
}

LTCJaxxCustomRelay.prototype.getRelayTypeWithCallback = function(callback, passthroughParams) {
    var relayName = 'LTCJaxxCustomRelay';
	callback("success", relayName, passthroughParams);
	return relayName; 
}

LTCJaxxCustomRelay.prototype.getRelayTypeWithCallbackForgettingStatus = function(callback) {
	var relayName = 'LTCJaxxCustomRelay';
	callback(relayName);
	return relayName; 
}

if (typeof(exports) !== 'undefined') {
    exports.relayJaxxCustom = LTCJaxxCustomRelay;
}

LTCJaxxCustomRelay.prototype.getMultiAddressBalance = function(addresses, callback, passthroughParams) {
    // @NOTE: confirmed balances returned
    // getMultiAddressBalance("198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve", function(){console.log(arguments);}, "passthroughParams") // 
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getBalance :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);

        return;
    }
    var self = this;
    var requestString = this._baseUrl + "balance/" + addresses;
    // https://api.jaxx.io/api/ltc/balance/LhGYSWAabViCqsLiGKCwND7aC1yDC9TApd,LYsBRZqfme1hjTYPnxEm8hpYJaDZYZrky8
    RequestSerializer.getJSON(requestString, function (response, status, passthroughParams) {
        // {"LhGYSWAabViCqsLiGKCwND7aC1yDC9TApd":{"confirmed":{"amount":"0.0565702","litoshi":"5657020"},"unconfirmed":{"amount":"0","litoshi":"0"}},"LYsBRZqfme1hjTYPnxEm8hpYJaDZYZrky8":{"confirmed":{"amount":"18.62898938","litoshi":"1862898938"},"unconfirmed":{"amount":"0","litoshi":"0"}}} // response
        var responseData = self.getMultiAddressBalanceParse(response);
        callback(status, responseData, passthroughParams);
    },true, passthroughParams);
}

LTCJaxxCustomRelay.prototype.getMultiAddressBalanceParse = function(response){
    
    var returnData = [];
    var arrAddresses = Object.keys(response);
    for (var i = 0; i < arrAddresses.length; i++){
        var returnElement = {};
        var accountData = response[arrAddresses[i]];
        returnElement.address = arrAddresses[i];
        //returnElement.balance = parseFloat(accountData.confirmed.amount);
        returnElement.balance = parseFloat(accountData.confirmed.amount) + parseFloat(accountData.unconfirmed.amount);
        returnData.push(returnElement);
    }
    return returnData;
}