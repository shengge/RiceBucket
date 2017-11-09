/*


The DAO:

There's the usage of the HD wallet structure, when individual transactions come in they are checked for categories of voting or transferring, and placed in their respective array.


Transferring:

When a send occurs, the transferable addresses, highest value to lowest, are checked for a proper balance.

From here, there are two options: the first is that the transferable address could forward balances to another internal transferable address, in which case the address would have a balance and the sending could be from that. This would have a degree of latency to the transaction as the sweep phase would need to be completed ("cleared") before the actual transaction could be sent out.

The second, which is being implemented here, is that the highest valued index that has the balance available is used. If that isn't enough, more nodes with lower valued indexes are used. While not taking additional time to clear, this has the side effect that multiple large to small transferable addresses are necessarily compiled and sent with larger transaction fees than you'd need for one transaction.

Voting:

There are many options here, and no explicit "right" way of doing things, so we're minimizing user friction as the goal of these algorithms.


There is an explicit constraint currently with the 1.0 DAO code, where you cannot vote with dao tokens unless there is an ethereum balance available on the token's associated address.

*/

var CoinToken = function() {
    this._isTokenFromDCLPerspective = true;

    this._coinType = -1; // Used for the DCL Layer - data duplication that needs to be removed later
    this._tokenName = "";
    this._tokenSymbol = "";
    this._tokenCoinType = 0;

    this._hdCoinType = -1;
    
    this._tokenImpl = null;
    
    this._storageKey = "";
    
    this._coinHolderWallet = null;
    this._gasPrice = 0;
    this._gasLimit = 0;

    this._isTransferable = false;
    this._isVotable = false;
    
    this._transferableAddresses = [];
    this._votableAddresses = [];
    
    // this._sortedHighestAccountArray = [];

    this._transferableTokens = {};
    this._votableTokens = {};
    
    this._listeners = [];

    this._worker = null;
    
    this._currentReceiveAddress = "";
    
    this._w_addressMap = {};
    
    this._smallQrCode = null;

    this._hasInitRefresh = false;
    
    this._hasInsufficientGasForSpendable = [];
    this._hasBlockedForSpendable = [];
    
    this._numShiftsNecessary = 0;
    
    this._doTXDebug = false;

    this._dataStorageController = null;

    this._transferrableAddresses = [];

    this._isCoinPouchActivated = false;
    this._shapeShiftDepositAddress = null;

    this._sendingFullMaxSpendable = false;
    this._maxSpendableCachedAmount = "";
}

CoinToken.TheDAO = 0;
CoinToken.Augur = 1;
CoinToken.numCoinTokens = 2;

//@note: gets the coin type that holds this token.
CoinToken.getTokenCoinHolderType = function(tokenType) {
    if (tokenType === CoinToken.TheDAO) {
        return COIN_ETHEREUM;
    } else if (tokenType === CoinToken.Augur) {
        return COIN_ETHEREUM;
    }
}

//@note: gets all token types that are held by this coin type.
CoinToken.getCoinTypeTokenList = function(coinType) {
    var tokenTypeList = [];
    
    for (var i = 0; i < CoinToken.numCoinTokens; i++) {
        if (CoinType.getTokenCoinHolderType(i) === coinType) {
            tokenTypeList += i;
        }
    }
    
    return tokenTypeList;
}

//@note: returns the main COIN_THEDAO_ETHEREUM type mapping for this token type.
CoinToken.getTokenToMainTypeMap = function(tokenType) {
    if (tokenType === CoinToken.TheDAO) {
        return COIN_THEDAO_ETHEREUM;
    } else if (tokenType === CoinToken.Augur) {
        return COIN_AUGUR_ETHEREUM;
    }
}

//@note: returns the token type for this main COIN_THEDAO_ETHEREUM type mapping.
CoinToken.getMainTypeToTokenMap = function(mainType) {
//    console.log("token type for main coin type :: " + coinType);
    if (mainType === COIN_THEDAO_ETHEREUM) {
        return CoinToken.TheDAO;
    } else if (mainType === COIN_AUGUR_ETHEREUM) {
        return CoinToken.Augur;
    }
}

//@note: returns the coin type that holds this token, for this main COIN_THEDAO_ETHEREUM type mapping.
CoinToken.getMainTypeToTokenCoinHolderTypeMap = function(mainType) {
    return CoinToken.getTokenCoinHolderType(CoinToken.getMainTypeToTokenMap(mainType));
}

CoinToken.getStaticTokenImplementation = function(tokenType) {
    //@note: @here: @token: this seems necessary.
    if (tokenType === CoinToken.TheDAO) {
        return CoinTokenTheDAOEthereum;
    } else if (tokenType === CoinToken.Augur) {
        return CoinTokenAugurEthereum;
    }
}

//CoinToken.getStaticCoinWorkerImplementation = function(coinType) {
//}

CoinToken.getNewTokenImplementation = function(tokenType) {
    //@note: @here: @token: this seems necessary.
    if (tokenType === CoinToken.TheDAO) {
        return new CoinTokenTheDAOEthereum();
    } else if (tokenType === CoinToken.Augur) {
        return new CoinTokenAugurEthereum();
    }
}


CoinToken.prototype.txLog = function(logString) {
    if (this._doTXDebug) {
        console.log(logString);
    }
}

CoinToken.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType) {
    var coinAmount = 0;
    
    var multiplier = 100;

    var wei = wallet.getHelper().convertFiatToWei(fiatAmount);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertWeiToEther(wei) * multiplier : wei * multiplier;
    
    return coinAmount;
}

CoinToken.prototype.initialize = function(tokenName, tokenSymbol, tokenCoinType, baseReceiveAddress, coinHolderWallet, gasPrice, gasLimit, storageKey) {
    console.log("[ Initializing  " + tokenName + " token ]");
    this._tokenName = tokenName;
    this._tokenSymbol = tokenSymbol;
    this._tokenCoinType = tokenCoinType;
    
    this._storageKey = storageKey;
    
    this._currentReceiveAddress = baseReceiveAddress;
    
    this._tokenImpl = CoinToken.getNewTokenImplementation(this._tokenCoinType);

    this._tokenImpl.initialize(this);
    // These are used for the JaxxCryptoController in the DCL Layer
    this._coinType = this._tokenImpl.getBaseCoinAddressFormatType();
    this._hdCoinType = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).pouchParameters['coinHDType'];
    this._coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents['coinFullName'];
    
    //@note: for account list, which should be a simple keypair.
    this._hasFinishedFinalBalanceUpdate = true;
    
    //@note: for account list, which should be a simple keypair.
    this._hasFinishedFinalBalanceUpdate = true;
    
    this._coinHolderWallet = coinHolderWallet;
    this._gasPrice = gasPrice;
    this._gasLimit = gasLimit;

    this.loadAndCache();
    
    this.setupWorkers();
}

CoinToken.prototype.shutDown = function() {
    if (this._worker) {
        this._worker.postMessage({
            action: 'shutDown', 
        });
    }
}

CoinToken.prototype.getPouchFoldImplementation = function() {
    return this._tokenImpl;
}

CoinToken.prototype.loadAndCache = function() {
    var self = this;

//    var transactionCache = getStoredData('wTxCache_' + this._coinFullName + "_" + this._storageKey, true);
//
//    //    console.log("tx cache :: " + transactionCache + " :: " + this._coinFullName);
//
//    if (transactionCache) {
//        try {
//            this._transactions = JSON.parse(transactionCache);
//        } catch (e) {
//            console.log(e);
//        }
//    }
}

CoinToken.prototype.setupWorkers = function() {
/*
    try {
        this._worker = new Worker('./js/wallet/token/coin_token_worker.js');

        var self = this;
        this._worker.onmessage = function(message) {
            var action = message.data.action;

            // Log to our logger
            if (action === 'log') {
                self.log.apply(self, message.data.content);

                // Set transaction, utxo, etc.
            } else if (action === 'update') {

//                var numPrevTXKeys = Object.keys(self._transactions).length;
//                var numUpdateTXKeys = Object.keys(message.data.content.transactions).length;
//
//                var didModifyTX = false;
//
//                if (numPrevTXKeys < numUpdateTXKeys) {
//                    didModifyTX = true;
//                }
//
//                //                console.log("update :: " + self._coinFullName);
//
//                if (message.data.content.transactions) {
//                    var transactions = message.data.content.transactions;
//                    for (var txid in transactions) {
//                        var transaction = transactions[txid];
//
//                        if (self._coinType === COIN_BITCOIN) {
//                            var existingTransaction = self._transactions[txid];
//                            if (typeof(existingTransaction) === 'undefined') {
//                                existingTransaction = null;
//                            }
//                            //@note: @here: @next:
//                            //                            if (typeof(existingTransaction) !== 'undefined' && existingTransaction !== null && existingTransaction.inputs && existingTransaction.outputs) {
//                            //                                if (transaction.inputs.length !== existingTransaction.inputs.length) {
//                            //                                    console.log("tx inputs different length");
//                            //                                    didModifyTX = true;
//                            //                                }
//                            //                                
//                            //                                if (transaction.outputs.length !== existingTransaction.outputs.length) {
//                            //                                    console.log("tx outputs different length");
//                            //                                    didModifyTX = true;
//                            //                                }
//                            //                            }
//
//                            // We need to convert all the amounts from BTC to satoshis (cannot do this inside the worker easily)
//                            for (var i = 0; i < transaction.inputs.length; i++) {
//                                var input = transaction.inputs[i];
//                                input.amount = HDWalletHelper.convertBitcoinsToSatoshis(input.amountBtc);
//
//                                if (existingTransaction && (existingTransaction.inputs[i].addressIndex !== input.addressIndex || existingTransaction.inputs[i].addressInternal !== input.addressInternal)) {
//                                    //                                    console.log("[inputs] :: " + i + " :: [existingTransaction] :: addressIndex :: " + existingTransaction.inputs[i].addressIndex + " :: addressInternal :: " + existingTransaction.inputs[i].addressInternal + " :: [incomingTransaction] : addressIndex :: " + input.addressIndex + " :: addressInternal :: " + input.addressInternal);
//                                    didModifyTX = true;
//                                }
//                                //                                console.log("input.amountBtc :: " + input.amountBtc + " :: input.amount :: " + input.amount)
//                            }
//                            for (var i = 0; i < transaction.outputs.length; i++) {
//                                var output = transaction.outputs[i];
//                                output.amount = HDWalletHelper.convertBitcoinsToSatoshis(output.amountBtc);
//
//                                if (existingTransaction && (existingTransaction.outputs[i].addressIndex !== output.addressIndex || existingTransaction.outputs[i].addressInternal !== output.addressInternal)) {
//                                    //                                    console.log("[outputs] :: " + i + " :: [existingTransaction] :: addressIndex :: " + existingTransaction.outputs[i].addressIndex + " :: addressInternal :: " + existingTransaction.outputs[i].addressInternal + " :: [incomingTransaction] : addressIndex :: " + output.addressIndex + " :: addressInternal :: " + output.addressInternal);
//
//                                    didModifyTX = true;
//                                }
//
//                                //                                console.log("output.amountBtc :: " + output.amountBtc + " :: output.amount :: " + output.amount)
//                            }
//
//                            self._transactions[txid] = transaction;
//                            self._spendableBalance = null;
//                        } else if (self._coinType === COIN_ETHEREUM) {
//                            //                                                        console.log("wallet worker update :: eth tx :: " + Object.keys(transactions).length);
//                            //                            console.log("incoming eth tx :: " + JSON.stringify(transaction) + " :: " + txid);
//                            self._transactions[txid] = transaction;
//
//                            self._spendableBalance = null;
//
//                            self._largeQrCode = null;
//                            self._smallQrCode = null;
//                        }
//                    }
//
//                    if (self._txCacheValid === false ||                                     didModifyTX === true || self._coinType === COIN_BITCOIN) {
//                        //                        if (self._coinType === COIN_BITCOIN) {
//                        //                            console.log(self._coinFullName + " ::  updating transaction cache");
//                        //                        }
//                        self._txCacheValid = true;
//
//                        //                        var zip = new thirdparty.zip();
//                        //                        zip.file('txfiles', JSON.stringify(self._transactions));
//                        //                        
//                        //                        var data = zip.generate({base64:true, compression:'DEFLATE'});
//                        //                        console.log("transaction data :: " + JSON.stringify(self._transactions).length + " :: compressed :: " + data.length);
//                        //                        
//
//                        storeData('wTxCache_' + self._coinFullName + "_" + self._storageKey, JSON.stringify(self._transactions), true);
//
//                        //                        storeData('wTxCacheCompressed_' + self._coinFullName + "_" + self._storageKey, data, true);
//                    } else {
//                        //                        if (self._coinType === COIN_BITCOIN) {
//                        //                            console.log(self._coinFullName + " ::  not updating transaction cache");
//                        //                        }
//                    }
//                }
//
//                if (message.data.content.currentReceiveAddress) {
//                    //                    console.log("pouch :: " + self._coinFullName + " :: update receive address :: " + message.data.content.currentReceiveAddress);
//                    self._currentReceiveAddress = message.data.content.currentReceiveAddress;
//
//                    storeData('wCurRecA_' + self._coinFullName + "_" + self._storageKey, self._currentReceiveAddress, true);
//                }
//
//                if (message.data.content.currentChangeIndex && message.data.content.currentChangeAddress) {
//                    self._currentChangeIndex = message.data.content.currentChangeIndex;
//                    self._currentChangeAddress = message.data.content.currentChangeAddress;
//                }
//
//                if (message.data.content.smallQrCode) {
//                    self._smallQrCode = message.data.content.smallQrCode;
//                }
//
//                if (message.data.content.largeQrCode) {
//                    self._largeQrCode = message.data.content.largeQrCode;
//                }
//
                if (message.data.content.workerCacheAddressMap) {
                    var workerCacheAddressMap = message.data.content.workerCacheAddressMap;

                    var numPrevWorkerCacheKeys = Object.keys(self._w_addressMap).length;
                    var numUpdatedWorkerCacheKeys = Object.keys(workerCacheAddressMap).length;

                    var cacheBalancesUpdated = false;

                    for (var address in workerCacheAddressMap) {
                        var accountInfo = workerCacheAddressMap[address];
                        var existingAccountInfo = self._w_addressMap[address];

                        if (typeof(existingAccountInfo) !== 'undefined' && existingAccountInfo !== null) {
                            if (existingAccountInfo.balance !== accountInfo.balance && (typeof(existingAccountInfo.newSendTx) === 'undefined' || existingAccountInfo.newSendTx === null)) {
                                cacheBalancesUpdated = true;
                            }
                        } 
                    }
//
                    if (self._wkrCacheValid === false || numPrevWorkerCacheKeys < numUpdatedWorkerCacheKeys || cacheBalancesUpdated === true) {

                        self._wkrCacheValid = true;
                        storeData('wWrkrCacheAddrMap_' + self._tokenName + "_" + self._storageKey, JSON.stringify(workerCacheAddressMap), true);
                    } else {
                        //                        console.log(self._coinFullName + " ::  not updating worker cache");
                    }
//
//                    console.log("received update :: " + JSON.stringify(workerCacheAddressMap));
                    self._w_addressMap = workerCacheAddressMap;
//
//                    if (self._coinFullName === "Bitcoin") {
//                    } else if (self._coinFullName === "Ethereum") {
//                        self.sortHighestAccounts();
//                    }
//
//                    //                    self._notify();
                }

                self._notify();
            };
        }
    } catch (err) {
        console.error(err);
    }
    
    var self = this;

    if (this._worker) {
        var shouldPostWorkerCache = false;

        var workerCacheAddressMap = getStoredData('wWrkrCacheAddrMap_' + this._tokenName + "_" + this._storageKey, true);
////
        if (workerCacheAddressMap) {
            try {
                workerCacheAddressMap = JSON.parse(workerCacheAddressMap);

                for (var idx in workerCacheAddressMap) {
                    workerCacheAddressMap[idx].newSendTX = null;
                }

                this._w_addressMap = workerCacheAddressMap;

                shouldPostWorkerCache = true;
            } catch (e) {
                this.txLog('Invalid cache:', workerCache);
            }
        }

        //        if (this._coinFullName === "Ethereum") {
        //        console.log("_w_addressMap :: " + this._coinFullName + "\n" + JSON.stringify(this._w_addressMap));
        //        }
        this.txLog(this._tokenName + " :: initialize token worker");
        
        this._worker.postMessage({
            action: 'initialize',
            content: {
                tokenName: self._tokenName,
                tokenSymbol: self._tokenSymbol,
                tokenCoinType: self._tokenCoinType,
            }
        });

        if (shouldPostWorkerCache === true) {
            this._worker.postMessage({
                action: 'restoreAddressMapCache',
                content: {
                    workerCacheAddressMap: workerCacheAddressMap
                }
            });
        }

//        this._worker.postMessage({
//            action: 'triggerExtendedUpdate',
//            content: {
//                type: 'balances'
//            }
//        });
//        this._worker.postMessage({
//            action: 'setTokenAddresses',
//            content: {
//                transferableTokenAddresses: self._transferableAddresses,
//                votableTokenAddresses: self._votableAddresses
//            }
//        });
    }
*/
}

CoinToken.prototype.setIsTransferable = function(transferableList) {
    
    //@note: @here: @todo: check for deltas
    if (transferableList && transferableList.length > 0) {
        this._isTransferable = true;
        this._transferableAddresses = transferableList;
    } else {
        this._isTransferable = false;
        this._transferableAddresses = [];
    }
    
    var self = this;

    if (this._worker) {
        this._worker.postMessage({
            action: 'setTokenAddresses',
            content: {
                transferableTokenAddresses: self._transferableAddresses,
                votableTokenAddresses: self._votableAddresses
            }
        });
    }
}

CoinToken.prototype.setIsVotable = function(votableList) {
    
    //@note: @here: @todo: check for deltas

    if (votableList && votableList.length > 0) {
        this._isVotable = true;
        this._votableAddresses = votableList;
    } else {
        this._isVotable = false;
        this._votableAddresses = [];
    }
    
    var self = this;

    if (this._worker) {
        this._worker.postMessage({
            action: 'setTokenAddresses',
            content: {
                transferableTokenAddresses: self._transferableAddresses,
                votableTokenAddresses: self._votableAddresses
            }
        });
    }
}

CoinToken.prototype.getTokenName = function() {
    return this._tokenName;
}

CoinToken.prototype.getTokenSymbol = function() {
    return this._tokenSymbol;
}

CoinToken.prototype.getTokenCoinType = function() {
    return this._tokenCoinType;
}

CoinToken.prototype.updateTokenData = function() {
    this._worker.updateTokenData(this._transferableAddresses, this._votableAddresses);
}

CoinToken.prototype.getTransferableBalance = function() {
    var totalBalance = 0;
    for (idx in this._transferableAddresses) {
        var curAddress = this._transferableAddresses[idx];
        var addressInfo = this._w_addressMap[curAddress];
        
        if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
            if (addressInfo.isTransferable !== true) {
                console.log("getTransferableBalance :: addressInfo not transferable :: " + curAddress);
            }
            
//            console.log("checking transferable address :: " + curAddress + " :: balance :: " + addressInfo.balance);

            totalBalance += addressInfo.balance;
        } else {
//            console.log("getTransferableBalance :: addressInfo not defined :: " + curAddress);
        }
    }
    
//    console.log("token :: " + this._tokenName + " :: transferable balance :: " + totalBalance);
    
    return totalBalance;
}

CoinToken.prototype.getVotableBalance = function() {
    var totalBalance = 0;
    for (idx in this._votableAddresses) {
        var addressInfo = this._w_addressMap[this._votableAddresses[idx]];

        if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
            if (addressInfo.isVotable !== true) {
                console.log("getVotableBalance :: addressInfo is not votable :: " + this._votableAddresses[idx]);
            }
            
            totalBalance += addressInfo.balance;
        } else {
            console.log("getVotableBalance :: addressInfo not defined :: " + this._votableAddresses[idx]);
        }
    }

    return totalBalance;
}

CoinToken.prototype.transferTokens = function(fromAddress, toAddress, transferFunction, doneCallback) {
    
}

CoinToken.prototype.voteTokens = function(fromAddress, voteFunction, doneCallback) {
    
}

CoinToken.prototype.refresh = function () {
    if (this._worker) {
        this._worker.postMessage({
            action: 'refresh',
            content: { }
        });
    }
}

CoinToken.prototype.refreshIfNecessary = function() {
    if (this._hasInitRefresh === false) {
        this._hasInitRefresh = true;

        this.refresh();
    }
}

CoinToken.prototype.getSpendableBalance = function(minimumValue) {
  // g_JaxxApp.getPouchFold..... test
  //    return 123456789123456789123456;

    if (typeof(minimumValue) === 'undefined' || minimumValue === null) {
        minimumValue = 0;
    }

    var sortedHighestAccountArray = [this.getDataStorageController().getHighestAccountBalanceAndIndex()];

    var spendableBalance = 0;// this.getDataStorageController().getBalanceSpendableDB(); // Delegate to DCL Layer;
    var numPotentialTX = 0;

    var highestAccountDict = this.getHighestAccountBalanceAndIndex(this._coinHolderWallet, this._gasPrice, this._gasLimit);

//    console.log("the dao :: ethereum transaction :: highestAccountDict :: " + highestAccountDict);

    if (highestAccountDict !== null) {

        //@note: this array is implicitly regenerated and sorted when the getHighestAccountBalanceAndIndex function is called.
        for (var i = 0; i < sortedHighestAccountArray.length; i++) {
            var accountBalance = sortedHighestAccountArray[i].balance;
//            console.log("DAO account :: " + sortedHighestAccountArray[i].address + " :: value :: " + accountBalance);

            if (accountBalance <= minimumValue) {

            } else {
                spendableBalance += accountBalance;
                numPotentialTX++;
            }
        }
        
//        console.log("DAO spendable :: " + spendableBalance + " :: " + numPotentialTX + " :: minimumValue :: " + minimumValue);
    }
    
    if (spendableBalance === 0) {
        this._numShiftsNecessary = 1;
    } else {
        this._numShiftsNecessary = numPotentialTX;
    }
    
    //@note: don't cache if a custom minimum value.
    if (typeof(minimumValue) === 'undefined' || minimumValue === null) {
        this._spendableBalance = spendableBalance;
    }

    return spendableBalance;

    //return this.getDataStorageController().getBalanceSpendableDB(); // Delegate to DCL Layer
}

CoinToken.prototype.getSpendableAddresses = function(minimumValue, totalCoinHolderGasRequired) {
    if (typeof(minimumValue) === 'undefined' || minimumValue === null) {
        minimumValue = 0;
    }

    var sortedHighestAccountArray = this.getDataStorageController().getHighestAccountBalanceAndIndex();
    var spendableAccounts = [];
    var numPotentialTX = 0;

    var highestAccountDict = this.getHighestAccountBalanceAndIndex(this._coinHolderWallet, this._gasPrice, totalCoinHolderGasRequired);

//    console.log("the dao :: ethereum transaction :: highestAccountDict :: " + highestAccountDict);

    if (highestAccountDict !== null) {

        //@note: this array is implicitly regenerated and sorted when the getHighestAccountBalanceAndIndex function is called.
        for (var i = 0; i < sortedHighestAccountArray.length; i++) {
            var accountBalance = sortedHighestAccountArray[i].balance;
            
//            console.log("DAO account :: " + sortedHighestAccountArray[i].address + " :: value :: " + accountBalance);

            if (accountBalance > minimumValue) {
                spendableAccounts.push(sortedHighestAccountArray[i]);
            } else {
            }
        }

        //        console.log("DAO spendable :: " + spendableBalance + " :: " + numPotentialTX + " :: minimumValue :: " + minimumValue);
    }

    return spendableAccounts;
}

//@note: @here: this needs to be populated by getSpendableBalance.
CoinToken.prototype.getShiftsNecessary = function(minimumValue) {
    var spendableBalance = this.getSpendableBalance(minimumValue)
    return this._numShiftsNecessary;
}

CoinToken.prototype.hasInsufficientGasForSpendable = function(gasLimit) {
    // returns account dictionary in REP that has accounts without enough ether to send a tx
    // @TODO: Generalize later when we are able to send from more than 1 address.
    if (typeof(gasLimit) === 'undefined' || gasLimit === null) {
        gasLimit = this._gasLimit;
    }
    
    var highestAccountDict = this.getHighestAccountBalanceAndIndex(this._coinHolderWallet, this._gasPrice, gasLimit);
    if (highestAccountDict === null){
        return []; // Occurs when the wallet has no token funds
    }
    var tokenHolder = CoinToken.getTokenCoinHolderType(this._tokenCoinType);
    var cryptoControllerForTokenHolder = wallet.getPouchFold(tokenHolder).getDataStorageController();
    var ethereumBalanceInHighestAccount = cryptoControllerForTokenHolder.getBalanceByAddress(highestAccountDict.address);
    var txCost = gasLimit.valueOf() * this._gasPrice.valueOf();
    if (ethereumBalanceInHighestAccount < txCost) {
        return [highestAccountDict];
    } else {
        return [];
    }
}

CoinToken.prototype.hasBlockedForSpendable = function() {
    var highestAccountDict = this.getHighestAccountBalanceAndIndex(this._coinHolderWallet, this._gasPrice, this._gasLimit);

    if (highestAccountDict !== null) {
        return this._hasBlockedForSpendable;
    } else {
        return false;
    }
}

CoinToken.prototype.getPouchFoldBalance = function() {
//    return 123456789123456789123456;
    return this.getTransferableBalance();
}

CoinToken.prototype._notify = function(reason) {
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i](CoinToken.getTokenToMainTypeMap(this._tokenCoinType));
    }
}

CoinToken.prototype.addListener = function(callback) {
    this._listeners.push(callback);
}

CoinToken.prototype.removeListener = function(callback) {
    for (var i = this._listeners.length - 1; i >= 0; i--) {
        if (this._listeners[i] === callback) {
            this._listeners.splice(i, 1);
        }
    }
}

CoinToken.prototype.getCurrentReceiveAddress = function() {
    var address = this._currentReceiveAddress;
    
    if (CoinToken.getTokenCoinHolderType(this._tokenCoinType) === COIN_ETHEREUM) {
        address = HDWalletHelper.toEthereumChecksumAddress(address);
    }
    
    return address;
}

CoinToken.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var uri = "";
    
    var qrCode = "";

    if (CoinToken.getTokenCoinHolderType(this._tokenCoinType) === COIN_ETHEREUM) {
        uri = "iban:" + HDWalletHelper.getICAPAddress(this._currentReceiveAddress);
    }
    
    if (coinAmountSmallType) {
        uri += "?amount=" + coinAmountSmallType;
    }
    
    if (largeFormat) {
        if (coinAmountSmallType || typeof(this._largeQrCode) === 'undefined' || this._largeQrCode === null) {
            //            this.log('Blocked to generate QR big Code');
            this._largeQrCode =  "data:image/png;base64," + thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 7, margin: 1}).toString('base64');
        }

        qrCode = this._largeQrCode;
    } else {
        if (coinAmountSmallType || typeof(this._smallQrCode) === 'undefined' || this._smallQrCode === null) {
            //        console.log('Blocked to generate QR small Code');
            this._smallQrCode =  "data:image/png;base64," + thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 5, margin: 1}).toString('base64');

        }

        qrCode = this._smallQrCode;
    }    
    
//    console.log("token :: " + this._tokenName + " :: qr code :: " + JSON.stringify(this._smallQrCode));
    return qrCode;
}

CoinToken.prototype.getHistory = function() {
    return [];
}

CoinToken.prototype.setLogger = function(logger) {
    if (logger && logger.log) {
        this._logger = logger;
    } else {
        this._logger = console;
    }
}

CoinToken.prototype.getTransferOpCode = function() {
    var transferOpCode = "";
    
    var tokenIsERC20 = CoinToken.getStaticTokenImplementation(this._tokenCoinType).pouchParameters['tokenIsERC20'];
    
    if (tokenIsERC20 === true) {
        transferOpCode = CoinToken.getStaticTokenImplementation(this._tokenCoinType).pouchParameters['transferOpCode'];
    }
    
    return transferOpCode;
}

CoinToken.prototype.getRefundOpCode = function() {
    var refundOpCode = "";

    if (this._tokenCoinType === CoinToken.TheDAO) {
        refundOpCode = CoinToken.getStaticTokenImplementation(this._tokenCoinType).pouchParameters['refundOpCode'];
    }

    return refundOpCode;
}

CoinToken.prototype.getApproveOpCode = function() {
    var approveOpCode = "";

    if (this._tokenCoinType === CoinToken.TheDAO) {
        approveOpCode = CoinToken.getStaticTokenImplementation(this._tokenCoinType).pouchParameters['approveOpCode'];
    }

    return approveOpCode;
}

CoinToken.prototype.getAccountBalance = function(address) {
    var balance = 0;
	
    if (CoinToken.getTokenCoinHolderType(this._tokenCoinType) === COIN_ETHEREUM){
		address = address.toLowerCase();
	}

    var addressInfo = this._w_addressMap[address];
    if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
        balance = addressInfo.balance;
//        console.log("dao :: address :: " + address + " :: balance :: " + balance);
    } 

    return balance;
}

CoinToken.prototype.getAccountNonBlockedBalance = function(address) {
    var nonBlockedBalance = 0;
    
    var addressInfo = this._w_addressMap[address];
    if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
        if (addressInfo.isBlocked === false) {
            nonBlockedBalance = addressInfo.balance;
        }
    } 
    
    return nonBlockedBalance;
}

CoinToken.prototype.sortHighestAccounts = function(ethereumPouch, ethGasPrice, ethGasLimit) {
    var baseTXCost = ethGasPrice.mul(ethGasLimit).toNumber();

    var sortedHighestAccountArray = this.getDataStorageController().getHighestAccountBalanceAndIndex();
    var addressAvailableDict = {};
    // this._sortedHighestAccountArray = [];

    this._hasInsufficientGasForSpendable = []; // Will be an address list
    this._hasBlockedForSpendable = [];

    this._transferrableAddresses = this.getDataStorageController().getAddressesReceive();
    
    //@note: preprocess pass. the individual accounts need gas to transact.
    var totalBalance = 0;
    for (idx in this._transferableAddresses) {
        var curAddress = this._transferableAddresses[idx];
        var addressInfo = this._w_addressMap[curAddress];

        if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
            if (addressInfo.isTransferable !== true) {
//                console.log("getTransferableBalance :: addressInfo not transferable :: " + curAddress);
            }

            var internalIndexAddressDict = ethereumPouch.getInternalIndexAddressDict(curAddress);
            
            if (internalIndexAddressDict.index === -1) {
                continue;
            }
            
            var ethBalanceForAddress = ethereumPouch.getAccountBalance(internalIndexAddressDict.internal, internalIndexAddressDict.index);

//            if (addressInfo.balance > 0) {
//                console.log("checking transferable address :: " + curAddress + " :: balance :: " + addressInfo.balance + " :: ethBalanceForAddress :: " + ethBalanceForAddress + " :: baseTXCost :: " + baseTXCost + " :: internalIndexAddressDict :: " + JSON.stringify(internalIndexAddressDict));
//            }

            if (ethBalanceForAddress >= baseTXCost) {
                addressAvailableDict[curAddress] = {ethereumNodeIndex: internalIndexAddressDict.index};
                
                //                    console.log("token :: " + this._tokenName + " :: address :: " + ethBalanceForAddress + " :: isBlocked :: " + addressInfo.isBlocked);
                
                if (addressInfo.isBlocked === false) {
                    totalBalance += addressInfo.balance;
                } else {
                    this._hasBlockedForSpendable.push(curAddress);
                }
            } else {
                if (addressInfo.balance > 0) {
//                    console.log("getTransferableBalance :: address :: " + curAddress + " has insufficient ether for transfering.")
                    this._hasInsufficientGasForSpendable.push(curAddress);
                }
            }
        } else {
//                        console.log("getTransferableBalance :: addressInfo not defined :: " + curAddress);
        }
    }

//    console.log("token :: " + this._tokenName + " :: transferable balance :: " + totalBalance);

    if (Object.keys(addressAvailableDict).length > 0) {
        for (var address in addressAvailableDict) {
            var curBalance = 0;
            
            //@note: I don't need to check this for non-null since it is added to addressAvailable in the above pre-processing which does check for non-null.
            var addressInfo = this._w_addressMap[address];
            if (addressInfo.isBlocked === false) {
                curBalance = addressInfo.balance;
            }

            sortedHighestAccountArray.push({ethereumNodeIndex: addressAvailableDict[address].ethereumNodeIndex, addressInfo: addressInfo, address: address, balance: curBalance});
        }

        sortedHighestAccountArray.sort(function(a, b) {
            if (a.balance > b.balance) {
                return 1;
            } else if (a.balance < b.balance) {
                return -1;
            } else {
                return 0;
            }
        });

        sortedHighestAccountArray.reverse();
    }
}

CoinToken.prototype.getHighestAccountBalanceAndIndex = function(ethereumPouch, ethGasPrice, ethGasLimit) {
    return this.getDataStorageController().getHighestAccountBalanceAndIndex();
    /* this.sortHighestAccounts(ethereumPouch, ethGasPrice, ethGasLimit);

    return (this._sortedHighestAccountArray.length > 0) ? this._sortedHighestAccountArray[0] : null; */
}

CoinToken.prototype.buildERC20EthereumTransactionList = function(ethereumPouch, toAddress, amount_smallUnit, gasPrice, gasLimit, ethereumTXDataPrePendArray, doNotSign) {
    var amountDao = parseInt(amount_smallUnit);
    var sortHighestAccountArray = [this.getDataStorageController().getHighestAccountBalanceAndIndex()];

    var txArray = [];

    //@note: @here: @todo: add custom contract support when merging into the develop branch.
    var baseTXCost = gasPrice * gasLimit;

    var totalTXCost = 0;

    //@note: returns {index: x, balance: y} format.

    //var highestAccountDict = this.getHighestAccountBalanceAndIndex(ethereumPouch, gasPrice, gasLimit);
    var highestAccountDict = this._dataStorageController.getHighestAccountBalanceAndIndex();
    var accountInfo = {
        balance: highestAccountDict.balance,
        isBlocked: false,
        isTransferable: true,
        isVotable: false
    }
    highestAccountDict.accountInfo = accountInfo;
    highestAccountDict.ethereumNodeIndex = "0";

    console.log(" highestaccountinfo", highestAccountDict);
   // this.txLog("the dao :: ethereum transaction :: highestAccountDict :: " + highestAccountDict);
                
    if (highestAccountDict !== null) {
        //@note: check to see whether this will result in the tx being able to be pushed through with this one account, or whether there will need to be more than one account involved in this transaction.
        if (amountDao <= highestAccountDict.balance) {
            totalTXCost = baseTXCost;

            this.txLog("the dao :: ethereum transaction :: account :: " + highestAccountDict.address + " :: " + highestAccountDict.balance + " :: can cover the entire balance :: " + (amountDao));
            
            var ABIValueToTransfer = HDWalletHelper.zeroPadLeft(parseInt(amountDao).toString(16), 64);

            var ethData = ethereumTXDataPrePendArray[0] + ABIValueToTransfer;
            
            var newTX = ethereumPouch.getPouchFoldImplementation()._buildEthereumTransaction(false, parseInt(highestAccountDict.ethereumNodeIndex), toAddress, 0, gasPrice, gasLimit, ethData, doNotSign);

            if (!newTX) {
                this.txLog("error :: ethereum transaction :: account failed to build :: " + highestAccountDict.index);
                return null;
            } else {
                txArray.push(newTX);
            }
        } else {
            var txSuccess = true;

            var balanceRemaining = amountDao;

            //@note: this array is implicitly regenerated and sorted when the getHighestAccountBalanceAndIndex function is called.
            for (var i = 0; i < sortHighestAccountArray.length; i++) {
                this.txLog("the dao :: ethereum transaction :: balanceRemaining (pre) :: " + balanceRemaining);
                //                console.log(typeof(this._sortedHighestAccountArray[i].balance));
                var accountBalance = sortHighestAccountArray[i].balance;

                var amountToSendFromAccount = 0;

                //@note: check if subtracting the balance of this account from the remaining target transaction balance will result in exactly zero or a positive balance for this account.
                if (accountBalance - balanceRemaining < 0) {
                    //@note: this account doesn't have enough of a balance to cover by itself.. keep combining.
                    this.txLog("the dao :: ethereum transaction :: account :: " + sortHighestAccountArray[i].ethereumNodeIndex + " :: does not have enough to cover balance :: " + (balanceRemaining) + " :: accountBalance :: " + (accountBalance));

                    amountToSendFromAccount = (accountBalance);
                } else {
                    var accountChange = accountBalance - balanceRemaining;
                    //                        console.log("types :: " + typeof(balanceRemaining) + " :: " + typeof(baseTXCost));
                    amountToSendFromAccount = balanceRemaining;
                    this.txLog("the dao :: ethereum transaction :: account :: " + sortHighestAccountArray[i].ethereumNodeIndex + " :: accountBalance :: " + accountBalance + " :: account balance after (balance) :: " + accountChange);

                    //@note: don't do things like bitcoin's change address system for now.
                }

                this.txLog("the dao :: ethereum transaction :: account :: " + sortHighestAccountArray[i].ethereumNodeIndex + " :: will send  :: " + amountToSendFromAccount);


                var ABIValueToTransfer = HDWalletHelper.zeroPadLeft(parseInt(amountToSendFromAccount).toString(16), 64);

                var ethereumTXDataPrePend = ethereumTXDataPrePendArray[0];
                
                if (i >= ethereumTXDataPrePendArray.length) {

                } else {
                    ethereumTXDataPrePend = ethereumTXDataPrePendArray[i];
                }

                var ethData = ethereumTXDataPrePend + ABIValueToTransfer;
                
                //@note: build this particular transaction, make sure it's constructed correctly.
                var newTX = ethereumPouch.getPouchFoldImplementation()._buildEthereumTransaction(false, parseInt(sortHighestAccountArray[i].ethereumNodeIndex), toAddress, 0, gasPrice, gasLimit, ethData, doNotSign);

                if (!newTX) {
                    this.txLog("error :: the dao :: ethereum transaction :: account :: " + sortHighestAccountArray[i].ethereumNodeIndex + " cannot build");

                    txSuccess = false;
                    break;
                } else {
                    txArray.push(newTX);
                }

                //@note: keep track of the total TX cost for user review on the UI side.
                totalTXCost += baseTXCost;

                this.txLog("the dao :: ethereum transaction :: current total tx cost :: " + totalTXCost);

                //note: subtract the amount sent from the balance remaining, and check whether there's zero remaining.
                balanceRemaining -= amountToSendFromAccount;

                this.txLog("the dao :: ethereum transaction :: balanceRemaining (post) :: " + balanceRemaining);

                if (balanceRemaining <= 0) {
                    this.txLog("the dao :: ethereum transaction :: finished combining :: number of accounts involved :: " + txArray.length + " :: total tx cost :: " + totalTXCost);
                    break;
                }
            }
        }

        if (txSuccess === false) {
            this.txLog("the dao :: ethereum transaction :: txSuccess is false");
            return null;
        }

        //@note: ethereum will calculate it's own transaction fee inside of _buildTransaction.
        if (txArray.length > 0) {
            return {txArray: txArray, totalTXCost: totalTXCost};
        } else {
            this.txLog("the dao :: ethereum transaction :: txArray.length is zero");
            return null;    
        }
    } else {
        this.txLog("the dao :: ethereum transaction :: no accounts found");
        return null;
    }
}

CoinToken.prototype.isTokenType = function() {
    return true;
}

CoinToken.prototype.getAccountList = function() {
    var result = [];

    //@note: @here: we're simply assuming that it's non-hd.
    
    var account = {};
    
    var addressIndex = this._coinHolderWallet.getInternalIndexAddressDict(this._currentReceiveAddress);
    
    if (addressIndex < 1){
        account.pvtKey = this._coinHolderWallet.getPrivateKey(addressIndex.internal, addressIndex.index).d.toBuffer(32).toString('hex');
        account.pubAddr = this._coinHolderWallet.getPublicAddress(addressIndex.internal, addressIndex.index);
        account.balance = this._coinHolderWallet.getAccountBalance(addressIndex.internal, addressIndex.index);
        //@note: since CoinToken only refers to dao right now, this is obviously true.
        account.isTheDAOAssociated = true;

        result.push(account);
    }

    return result;
}

CoinToken.prototype.exportKeypairsSynched = function(callback, passthroughParams) {
    var self = this;
    this.getDataStorageController().restoreHistoryAll(function(err){
        if (err){
            // Run this block of code if the history was not restored successfully.
            setTimeout(function() {
                self.exportKeypairsSynched(callback, passthroughParams);
            }, 1000);
        } else {
            // Run this block of code if the history was restored successfully.
            // var keyPairs = self.getPrivateKeyCSVList();
            var keyPairs = self.getPrivateKeyCSVList();
            callback(keyPairs, passthroughParams);
        }
    });
}
CoinToken.prototype.setTransactionData = function(data){
    this.transactionData = data;
};
CoinToken.prototype.getTransactionData = function(){
    return this.transactionData;
};

CoinToken.prototype.setTransactionDataTemp = function(data){
    this.transactionDataTemp = data;
};
CoinToken.prototype.getTransactionDataTemp = function(){
    return this.transactionDataTemp;
};

CoinToken.prototype.setDataStorageController = function(ctr) {
  this._dataStorageController = ctr;
}

CoinToken.prototype.getDataStorageController = function(){
  return this._dataStorageController;
}

CoinToken.prototype.setCurrentReceiveAddress = function(address) {
  this._currentReceiveAddress = address;
}

CoinToken.prototype.getCurrentReceiveAddress = function() {
  var address = this._currentReceiveAddress;

  // address = this._coinPouchImpl.toChecksumAddress(address);

  return address;
}

CoinToken.prototype.getPouchFoldBalance = function(){
  // Get the balances and
  // wallet.getPouchFold(COIN_AUGUR_ETHEREUM).getPouchFoldImplementation()['getBaseCoinAddressFormatType2']
  if (typeof(this.getPouchFoldImplementation()['getPouchFoldBalance']) !== 'undefined' && this.getPouchFoldImplementation()['getPouchFoldBalance'] !== null) { // This is an override
      return this.getPouchFoldImplementation().getPouchFoldBalance();
  }
  if (typeof(this.getDataStorageController()) !== 'undefined' && this.getDataStorageController() !== null) {
      return this.getDataStorageController().getBalanceTotalDB();
  }
  return 0;
}

CoinToken.prototype.isToken = function(){ // Duplicate - use other function in next refactor
    return this._isTokenFromDCLPerspective;
}

CoinToken.prototype.activateCoinPouchIfInactive = function() {
  if (!this._isCoinPouchActivated){
    this.activateCoinPouch();
    this._isCoinPouchActivated = true;
  }
}

CoinToken.prototype.activateCoinPouch = function() {
  g_JaxxApp.getUI().setupTransactionList(this._coinType);
}
CoinToken.prototype.setShapeShiftDepositAddress = function(address) {
    //This function is only meant to check if shapeshift deposit address is same as previous deposit address
    //WARNING: PLEASE DO NOT USE THIS FUNCTION FOR GETTING ADDRESS. IT IS ONLY MEANT TO CHECK ADDRESS
    // console.error(address);
    this._shapeShiftDepositAddress = address;
}

CoinToken.prototype.getShapeShiftDepositAddress = function() {


    var address = this._shapeShiftDepositAddress;
    //  console.log(address)
    // address = this._coinPouchImpl.toChecksumAddress(address);

    return address;
}

CoinToken.prototype.getIsSendingFullMaxSpendable = function() {
  return this._sendingFullMaxSpendable;
}

CoinToken.prototype.setIsSendingFullMaxSpendable = function(value) {
  this._sendingFullMaxSpendable = value; // ie. true
}

CoinToken.prototype.getMaxSpendableCachedAmount = function(){
    return this._maxSpendableCachedAmount;
}

CoinToken.prototype.setMaxSpendableCachedAmount = function(newValue){
    this._maxSpendableCachedAmount = newValue;
}