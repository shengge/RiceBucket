/*


Ethereum:

There's the creation of the HD wallet structure, when individual transactions come in they are placed in receive nodes.

When a send occurs, the receives nodes, highest index to lowest, are checked for a proper balance.

From here, there are two options: the first is that the receive nodes could forward balances to another internal change node, in which case the change node would have a balance and the sending could be from that. This would have a degree of latency to the transaction as the sweep phase would need to be completed ("cleared") before the actual transaction could be sent out.

The second, which is being implemented here, is that the highest valued index that has the balance available is used. If that isn't enough, more nodes with lower valued indexes are used. While not taking additional time to clear, this has the side effect that multiple large to small receive nodes are necessarily compiled and sent with larger transaction fees than you'd need for one transaction.

*/

var HDWalletPouch = function() {
    this._isTokenFromDCLPerspective = false;

    this._coinType = -1;
    this._coinPouchImpl = null;
    
    this._cachedHistory = [];

    this._networkTypeString = "";
    this._hdCoinType = -1;
    this._coinFullName = "";
    
    this._mnemonic = "";
    this._storageKey = "";
    
    this._w_addressMap = {};
    
    this._token = [];
    
    this._currentReceiveAddress = null;
    this._currentChangeAddress = null;
    this._shapeShiftDepositAddress = null;

    this._seedHex = null;
    this._rootNode = null;
    this._accountNode = null;
    this._receiveNode = null;
    this._changeNode = null;
    
    this._privateKeyCache = {};
    this._publicAddressCache = {};
    this._checkAddressCache = {};
    
    this._internalIndexAddressCache = {};
    
    this._manualAddressCache = {};
    
    this._spendableBalance = null;
    
    this._sortedHighestAccountArray = null;

    this._currentChangeIndex = 0;
    this._transactions = {};
    
    this._numShiftsNecessary = 1;
    
    this._defaultTXFee = -1;
    this._txFeeOverride = -1;
    
    this._listeners = [];
    
    this._currentBlock = -1;
    this._blockRequestTimeout = 10000;
    
    this._smallQrCode = null;
    this._largeQrCode = null;

    this._helper = null;
    
//    this._customEthereumGasPrice = HDWalletHelper.getDefaultEthereumGasPrice();

    this._log = [];
    this._logger = console;
    

    this._TESTNET = false;

    this._STATIC_RELAY_URL = "";

    this._txCacheValid = false;
    this._wkrCacheValid = false;
    
    this._hasInitRefresh = false;
    
    this._hasFinishedFinalBalanceUpdate = false;
    
    this._miningFeeInterval = null;
    this._miningFeeUpdateTimer = 60 * 1000;
    
    this._miningFeeDict = {"fastestFee": 40, "halfHourFee": 20, "hourFee": 10, "customFee": 0};
    
    this._miningFeeLevel = -1;
    
    this._workerIsAvailable = true;


    //@note: @here: @dcl:

    this._dataStorageController = null;

    this._numberOfTransactionsInHistory = 10;

    this._isCoinPouchActivated = false;

    this._sendingFullMaxSpendable = false;
    this._maxSpendableCachedAmount = "";
    
    this._number_of_confirmations_necessary_to_suspend_calls = 24; // this is a default
    this._confirmation_max_for_UI = 6;
}

HDWalletPouch.MiningFeeLevelSlow = 0;
HDWalletPouch.MiningFeeLevelAverage = 1;
HDWalletPouch.MiningFeeLevelFast = 2;
HDWalletPouch.MiningFeeLevelCustom = 3;

HDWalletPouch.storedDeriveData = {}; //JSON.parse(getStoredData('PouchDerivedData', true));

HDWalletPouch.dictMiningFeeOptionID = { // Integers correspond to the HDWalletPouch values.
    0: "slowMiningFeeSelectionOption",
    1: "averageMiningFeeSelectionOption",
    2: "fastMiningFeeSelectionOption",
    3: "customMiningFeeSelectionOption"
};

HDWalletPouch.dictMiningOptionText = {
    0: "Slow mining fee is selected. BTC mining fee can be adjusted in the setting menu",
    1: "Average mining fee is selected. BTC mining fee can be adjusted in the setting menu",
    2: "Fast mining fee is selected. BTC mining fee can be adjusted in the setting menu",
    3: "Custom mining fee is selected. BTC mining fee can be adjusted in the setting menu"
}

HDWalletPouch._derive = function(node, index, hardened) {
    /*
    if (hardened) {
        return node.deriveHardened(index);
    } else {
        return node.derive(index);
    }*/
    // console.log("node:"+JSON.stringify(node));
    // console.log("index:"+JSON.stringify(index));
    // console.log("hardened:"+JSON.stringify(hardened));

    //, "index": JSON.stringify(index), "hardened":JSON.stringify(hardened)}));



    // return data if data is not cached
    //var storedDeriveData = this.getStoredDeriveData({node:})

    //
    /*
    var nodeClone = jQuery.extend(true, {}, node);
    var computedNode = null;
    console.log("Start function");
    console.log(thirdparty.objectHash.MD5(nodeClone)); //
    console.log(thirdparty.objectHash.MD5(nodeClone));
    var objDataToHash = {"node": nodeClone, "index": index, "hardened":hardened};
    console.log(thirdparty.objectHash.MD5(nodeClone));
    var nodeData = this.getStoredDeriveData(objDataToHash); // We store the data for optimization purposes.
    console.log(thirdparty.objectHash.MD5(nodeClone));
    if (typeof(nodeData) === 'undefined' || nodeData === null){
        //console.log(thirdparty.objectHash.MD5(nodeClone));
        computedNode = (!!hardened) ? node.deriveHardened(index) : node.derive(index);
        // console.log(JSON.stringify(nodeData));
        this.setStoredDeriveData(objDataToHash, node.toBase58());
    } else {
        computedNode = thirdparty.bitcoin.HDNode.fromBase58(nodeData);
    }
    // console.log(thirdparty.objectHash.MD5(nodeClone));
    // console.log(thirdparty.objectHash.MD5({"node": node, "index": index, "hardened":hardened}));
    // console.log({"node": node, "index": index, "hardened":hardened});
    // console.log(computedNode);
    return computedNode; */
    return (!!hardened) ? node.deriveHardened(index) : node.derive(index);
}

//@note: @here: @token: this seems necessary.

HDWalletPouch.getStaticCoinPouchImplementation = function(coinType) {
    //@note: @here: @token: this seems necessary.
    if (coinType === COIN_BITCOIN) {
        return HDWalletPouchBitcoin;
    } else if (coinType === COIN_ETHEREUM) {
        return HDWalletPouchEthereum;
    } else if (coinType === COIN_ETHEREUM_CLASSIC) {
        return HDWalletPouchEthereumClassic;
    } else if (coinType === COIN_THEDAO_ETHEREUM) {
        //@note: @here: @todo: this should be a thedao specific cointoken.
        return CoinTokenTheDAOEthereum;
    } else if (coinType === COIN_DASH) {
        return HDWalletPouchDash;
    } else if (coinType === COIN_AUGUR_ETHEREUM) {
        return CoinTokenAugurEthereum;
    } else if (coinType === COIN_LITECOIN) {
        return HDWalletPouchLitecoin;
    } else if (coinType === COIN_LISK) {
        return HDWalletPouchLisk;
    } else if (coinType === COIN_ZCASH) {
        return HDWalletPouchZCash;
    } else if (coinType === COIN_TESTNET_ROOTSTOCK) {
        return HDWalletPouchTestnetRootstock;
    } else if (coinType === COIN_DOGE) {
        return HDWalletPouchDoge;
    } 
}

HDWalletPouch.getStaticCoinWorkerImplementation = function(coinType) {
    //@note: @here: @token: this seems necessary.
    if (coinType === COIN_BITCOIN) {
        return HDWalletWorkerBitcoin;
    } else if (coinType === COIN_ETHEREUM) {
        return HDWalletWorkerEthereum;
    } else if (coinType === COIN_ETHEREUM_CLASSIC) {
        return HDWalletWorkerEthereumClassic;
    } else if (coinType === COIN_THEDAO_ETHEREUM) {
        //@note: @here: @todo: this should be a thedao specific cointoken.
        //@note: @here: this doesn't have the same parameters like block number.
        return CoinTokenWorker;
    } else if (coinType === COIN_DASH) {
        return HDWalletWorkerDash;
    } else if (coinType === COIN_AUGUR_ETHEREUM) {
        //@note: @here: @todo: this should be a thedao specific cointoken.
        //@note: @here: this doesn't have the same parameters like block number.
        return CoinTokenWorker;
    } else if (coinType === COIN_LITECOIN) {
        return HDWalletWorkerLitecoin;
    } else if (coinType === COIN_LISK) {
        return HDWalletWorkerLisk;
    } else if (coinType === COIN_ZCASH) {
        return HDWalletWorkerZCash;
    } else if (coinType === COIN_TESTNET_ROOTSTOCK) {
        return HDWalletWorkerTestnetRootstock;
    } 
}

HDWalletPouch.getNewCoinPouchImplementation = function(coinType) {
    //@note: @here: @token: this seems necessary.
    if (coinType === COIN_BITCOIN) {
        return new HDWalletPouchBitcoin();
    } else if (coinType === COIN_ETHEREUM) {
        return new HDWalletPouchEthereum();
    } else if (coinType === COIN_ETHEREUM_CLASSIC) {
        return new HDWalletPouchEthereumClassic();
    } else if (coinType === COIN_DASH) {
        return new HDWalletPouchDash();
    } else if (coinType === COIN_LITECOIN) {
        return new HDWalletPouchLitecoin();
    } else if (coinType === COIN_LISK) {
        return new HDWalletPouchLisk();
    } else if (coinType === COIN_ZCASH) {
        return new HDWalletPouchZCash();
    } else if (coinType === COIN_TESTNET_ROOTSTOCK) {
        return new HDWalletPouchTestnetRootstock();
    } else if (coinType === COIN_DOGE) {
        return new HDWalletPouchDoge();
    } // @TODO: Make a branch for Augur
}

//@note: @here: @todo: this 
HDWalletPouch.getCoinAddress = function(coinType, node) {
    var address = "";
//    console.log("getting address :: coinType :: " + coinType);
    
    address = HDWalletPouch.getStaticCoinPouchImplementation(coinType).getCoinAddress(node);
    
    return address;
}

//HDWalletPouch.getLightwalletEthereumAddress = function(node) {
//    //        console.log("[ethereum] node :: " + node);
//    var ethKeyPair = node.keyPair;
//    //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);
//
//    //@note: @here: hack to get the Q to regenerate on the next 'get', triggered by getPublicKeyBuffer.
//    //        ethKeyPair.__Q = null;
//    
//    var prevCompressed = ethKeyPair.compressed;
//    
//    ethKeyPair.compressed = false;
//
//    var ethKeyPairPublicKey = ethKeyPair.getPublicKeyBuffer();
//
//    var pubKeyHexEth = ethKeyPairPublicKey.toString('hex').slice(2);
//
//    var pubKeyWordArrayEth = thirdparty.CryptoJS.enc.Hex.parse(pubKeyHexEth);
//
//    var hashEth = thirdparty.CryptoJS.SHA3(pubKeyWordArrayEth, { outputLength: 256 });
//
//    var addressEth = hashEth.toString(thirdparty.CryptoJS.enc.Hex).slice(24);
//    
//    ethKeyPair.compressed = prevCompressed;
//
//    //        console.log("[ethereum] address :: " + addressEth);
//    return "0x" + addressEth;
//}

HDWalletPouch.prototype.initialize = function(coinType, testNet, helper) {
    this._coinType = coinType;
    
    this._miningFeeLevel = HDWalletPouch.MiningFeeLevelAverage;
    
    this._helper = helper;
    
    var networkTypeString = HDWalletHelper.getNetworkTypeStringForCoinType(coinType, testNet);
    this._networkTypeString = networkTypeString;
    
    //@note: @todo: adding ethereum testnet support.
    var coinHDType = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['coinHDType'];
    
    this._hdCoinType = coinHDType;
    
    var coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(coinType).uiComponents['coinFullName'];

    
    this._coinFullName = coinFullName;
   // this.log("[ HDWalletPouch Setup :: " + this._coinFullName + " ]");

    this._TESTNET = testNet;


}

HDWalletPouch.prototype.setupWithMnemonic = function(encMnemonic, mnemonic) {
    //@note: @security: this should not need to use the decrypted mnemonic as it's only an identifier, but it's needed for backwards compatibility.
    
    this._coinPouchImpl = HDWalletPouch.getNewCoinPouchImplementation(this._coinType);
        
    this._coinPouchImpl.initialize(this);

    this._storageKey = thirdparty.bitcoin.crypto.sha256(mnemonic + this._networkTypeString).toString('hex');



    ///console.warn('this._storageKey   '+mnemonic + '  networkTypeString: '+this._networkTypeString + '  storageKey: '+ this._storageKey+'   coin full name  '+this._coinFullName );
    
    var transactionCache = getStoredData('wTxCache_' + this._coinFullName + "_" + this._storageKey, true);
    
    // console.log("tx cache :: " + transactionCache + " :: " + this._coinFullName);
    
    if (transactionCache) {
        try {
            this._transactions = JSON.parse(transactionCache);
        } catch (e) {
            this.log(e);
        }
    }
    
    var workerCacheAddressMap = getStoredData('wWrkrCacheAddrMap_' + this._coinFullName + "_" + this._storageKey, true);

    if (workerCacheAddressMap) {
        try {
            workerCacheAddressMap = JSON.parse(workerCacheAddressMap);

            for (var idx in workerCacheAddressMap) {
                workerCacheAddressMap[idx].newSendTX = null;
            }

            this._w_addressMap = workerCacheAddressMap;

        } catch (e) {
            this.log('Invalid cache:', workerCache);
        }
    }

    this._mnemonic = mnemonic;

    this.loadAndCache();
    
    this.setupMiningFeeUpdater();
    
    var self = this;

    this.setupWorkers();

    this._requestBlockNumber(function(err) {
        //console.error(err)

        if (err) {
            self.log("initializeWithMnemonic :: error :: " + err);
        } else {
            console.log("initializeWithMnemonic :: first block :: " + self._currentBlock);
        }
    });

    setInterval(function() {
        self._requestBlockNumber(function(err) {
            if (err) {
                self.log("pouch :: " + self._coinType + " :: updating request block number :: error :: " + err);
            } else {
                //@note:@here:@todo: in case of block number update, only update part of the interface.
//                self._notify();
            }
        });
    }, this._blockRequestTimeout);

    this._coinPouchImpl.setup();
}


HDWalletPouch.prototype.setupMiningFeeUpdater = function() {
    var self = this;
    
    if (this._coinType === COIN_BITCOIN) {
        this._miningFeeInterval = setInterval(function() {
            self.updateMiningFees();
        }, this._miningFeeUpdateTimer);
    }

    this.getDefaultMiningFees();
    this.updateMiningFees();
}

HDWalletPouch.prototype.getDefaultMiningFees = function() {
    //@note: in bitcoin, this is the mining fee,
    //in ethereum this is the gas price. (not the gas limit).
    this._defaultTXFee = HDWalletHelper.getDefaultRegulatedTXFee(this._coinType);
}

//@note: @here: @todo: maybe put this in wallet helper class.

HDWalletPouch.prototype.updateMiningFees = function() {
//@note: in bitcoin, this is the mining fee,
//in ethereum this is the gas price. (not the gas limit).
    
    this._coinPouchImpl.updateMiningFees();
    
    this._defaultTXFee = HDWalletHelper.getDefaultRegulatedTXFee(this._coinType);
}

HDWalletPouch.prototype.getMiningFeeDict = function() {
    return this._miningFeeDict;
}

HDWalletPouch.prototype.getMiningFeeLevel = function() {
    return this._miningFeeLevel;
}

HDWalletPouch.prototype.setMiningFeeLevel = function(newMiningFeeLevel) {
    if (newMiningFeeLevel !== HDWalletPouch.MiningFeeLevelSlow &&
        newMiningFeeLevel !== HDWalletPouch.MiningFeeLevelAverage &&
        newMiningFeeLevel !== HDWalletPouch.MiningFeeLevelFast && 
        newMiningFeeLevel !== HDWalletPouch.MiningFeeLevelCustom) {
        this.log("HDWalletPouch :: setMiningFeeLevel :: error :: attempting to set mining fee to undetermined level :: " + newMiningFeeLevel);
        return;
    }
    
    this._miningFeeLevel = newMiningFeeLevel;
}

HDWalletPouch.prototype._notify = function(reason) {
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i](this._coinType);
    }
}

HDWalletPouch.prototype.addListener = function(callback) {
    this._listeners.push(callback);
}

HDWalletPouch.prototype.removeListener = function(callback) {
    for (var i = this._listeners.length - 1; i >= 0; i--) {
        if (this._listeners[i] === callback) {
            this._listeners.splice(i, 1);
        }
    }
}

HDWalletPouch.prototype.loadAndCache = function() {
    if (this._rootNode) {
        this.log("error :: trying to load HDWalletPouch again :: " + this._coinType);
        return;
    }
    
 //  console.error(" HDWalletPouch.prototype.loadAndCache     mnemonic :: " + this._mnemonic);

    var coinNetwork = null;

    if (this._TESTNET) {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.testNet;
    } else {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
    }
    
    var self = this;
    //////////////////////////////////////////////////////////////!!!!!!!!!!!!!!!///////////////////////
    var seedHex = CacheUtils.getCachedOrRun("wSh_" + this._coinFullName + "_" + self._storageKey, function() {
        var seedHex = thirdparty.bip39.mnemonicToSeedHex(self._mnemonic);
        return seedHex;
    });

    this._seedHex = seedHex;

    var rootNodeBase58 = CacheUtils.getCachedOrRun("wRTn_" + this._coinFullName + "_" + self._storageKey, function() {
        var rootNodeBase58 = thirdparty.bitcoin.HDNode.fromSeedHex(self._seedHex, coinNetwork).toBase58();
        return rootNodeBase58;
    });

    var rootNode = thirdparty.bitcoin.HDNode.fromBase58(rootNodeBase58, coinNetwork);
    this._rootNode = rootNode;

    var accountNodeBase58 = CacheUtils.getCachedOrRun("wAn_" + this._coinFullName + "_" + self._storageKey, function() {
        var accountNodeBase58 = HDWalletPouch._derive(HDWalletPouch._derive(HDWalletPouch._derive(self._rootNode, 44, true), self._hdCoinType, true), 0, true).toBase58();
        return accountNodeBase58;
    });

    var accountNode = thirdparty.bitcoin.HDNode.fromBase58(accountNodeBase58, coinNetwork);
    this._accountNode = accountNode;

    var receiveNodeBase58 = CacheUtils.getCachedOrRun("wRn_" + this._coinFullName + "_" + self._storageKey, function() {
        var receiveNodeBase58 = HDWalletPouch._derive(self._accountNode, 0, false).toBase58();
        return receiveNodeBase58;
    });
    
    var receiveNode = thirdparty.bitcoin.HDNode.fromBase58(receiveNodeBase58, coinNetwork);
    this._receiveNode = receiveNode;

//    if (this._coinType === COIN_ETHEREUM) {
////        console.log("[ethereum] legacy private key generated :: " + this._receiveNode.keyPair.d.toBuffer(32).toString('hex'));
////        HDWalletPouch.getCoinAddress(this._coinType, this._receiveNode).toString());
//        console.log("[ethereum] legacy address generated :: " + HDWalletPouch.getLightwalletEthereumAddress(this._receiveNode.neutered()).toString());
//    }


   // var changeNodeBase58 = CacheUtils.getCachedOrRun("wCn_" + this._coinFullName + "_" + self._storageKey, function() {
        var changeNodeBase58 = HDWalletPouch._derive(self._accountNode, 1, false).toBase58();
 // console.log('var changeNodeBase58 = HDWalletPouch._derive(self._accountNode, 1, false).toBase58();',changeNodeBase58)
     //   return changeNodeBase58;
   // });

    var changeNode = thirdparty.bitcoin.HDNode.fromBase58(changeNodeBase58, coinNetwork);
    this._changeNode = changeNode;
    
    
    
    //@note: using the neutered() versions here to get parity with the ethereum side of things in relation
    //to the wallet worker code. I'm relatively sure that the 
                  
    var currentReceiveAddress = getStoredData('wCurRecA_' + this._coinFullName + "_" + this._storageKey, true);
    if (!currentReceiveAddress) {
        currentReceiveAddress = HDWalletPouch.getCoinAddress(this._coinType,
          HDWalletPouch._derive(this._receiveNode, 0, false)).toString();
    }

    this._currentReceiveAddress = currentReceiveAddress;


  //  console.log("pouch :: " + this._coinType + " :: primary receive address :: " + this._currentReceiveAddress);

    //@note: @todo: @next: @optimization: pretty sure that this could be cached as it is generated.

//    this._currentChangeAddress = HDWalletPouch._derive(this._changeNode, 0, false).getAddress().toString();

    this._currentChangeAddress = HDWalletPouch.getCoinAddress(this._coinType,
      HDWalletPouch._derive(this._changeNode, 0, false)).toString();


 /// console.log("pouch :: " + this._coinType + " :: current change address :: " + this._currentChangeAddress,this._changeNode);



  var publicAddressCache = getStoredData('wPubAddrCache_' + this._coinFullName + "_" + this._storageKey, true);
    
    if (!publicAddressCache) {
        publicAddressCache = {};
    } else {
        publicAddressCache = JSON.parse(publicAddressCache);
    }
    
    this._publicAddressCache = publicAddressCache;
    
    var internalIndexAddressCache = getStoredData('wInternalIndexAddrCache_' + this._coinFullName + "_" + this._storageKey, true);

    if (!internalIndexAddressCache) {
        internalIndexAddressCache = {};
    } else {
        internalIndexAddressCache = JSON.parse(internalIndexAddressCache);
    }

    this._internalIndexAddressCache = internalIndexAddressCache;
  /*
    var qrCodeBase64Cache = getStoredData('wQRCodeCache_' + this._coinFullName + "_" + this._storageKey, true);

    if (!qrCodeBase64Cache) {
        qrCodeBase64Cache = {};
    } else {
        qrCodeBase64Cache = JSON.parse(qrCodeBase64Cache);
    }

    this._qrCodeBase64Cache = qrCodeBase64Cache;
    
    var manualAddressCache = getStoredData('wMnAddrCache_' + this._coinFullName + "_" + this._storageKey, true);
    
    if (!manualAddressCache) {
        manualAddressCache = {};
    } else {
        manualAddressCache = JSON.parse(manualAddressCache);
    }
*/
   // this._manualAddressCache = manualAddressCache;
}

HDWalletPouch.prototype.setupWorkers = function() {
    
    if (this._coinType === COIN_ETHEREUM ||
        this._coinType === COIN_BITCOIN ||
        this._coinType === COIN_DASH ||
        this._coinType === COIN_LITECOIN ||
        this._coinType === COIN_ZCASH || 
        this._coinType === COIN_DOGE) {
      //  this.log("[ HDWalletPouch :: " + this._coinFullName + " ] :: bypassing worker initialization");
        
        
        
        return;
    }
    
    // Background thread to run heavy HD algorithms and keep the state up to date
   // try {
        var cryptoCurrenciesAllowed = {};
        if (PlatformUtils.mobileiOSCheck()) {
            cryptoCurrenciesAllowed = HDWalletHelper.cryptoCurrenciesAllowed.ios;
        } else {
            cryptoCurrenciesAllowed = HDWalletHelper.cryptoCurrenciesAllowed.regular;
        }

        for (var curCryptoName in HDWalletHelper.dictCryptoCurrency) {
            var curCryptoDict = HDWalletHelper.dictCryptoCurrency[curCryptoName];

            if (curCryptoDict.index === this._coinType) {
                if (typeof(cryptoCurrenciesAllowed[curCryptoName]) !== 'undefined' &&
                    cryptoCurrenciesAllowed[curCryptoName] !== null &&
                    cryptoCurrenciesAllowed[curCryptoName] === true) {
                    this._workerIsAvailable = true;
                } else {
                    this._workerIsAvailable = false;
                }
            }
        }

        if (this._workerIsAvailable !== true) {
            console.log("[ HDWalletPouch :: " + this._coinFullName + " ] :: crypto disabled :: " + this._coinType);
            return;
        }
        

        return;
        this._worker = new Worker('./js/wallet/hdwallet_worker_manager.js');

        var self = this;
        
        this._worker.onmessage = function(message) {
            var action = message.data.action;

            // Log to our logger
            if (action === 'log') {
                console.log(message.data.content);
                // Set transaction, utxo, etc.
            } else if (action == 'didInitialize') {
                console.log("[ HDWalletPouch :: " + self._coinFullName + " ] :: finished initialization");

                self.completeWorkerInitialization();
            } else if (action === 'update') {

                var numPrevTXKeys = Object.keys(self._transactions).length;
                var numUpdateTXKeys = Object.keys(message.data.content.transactions).length;
                
                var didModifyTX = false;
                
                if (numPrevTXKeys < numUpdateTXKeys) {
                    didModifyTX = true;
                }
                
                //                console.log("update :: " + self._coinFullName);

                if (message.data.content.transactions) {
                    var transactions = message.data.content.transactions;
                    for (var txid in transactions) {
                        var transaction = transactions[txid];

                        var isTXUpdated = self._coinPouchImpl.updateTransactionsFromWorker(txid, transactions);
                        
                        if (isTXUpdated === true) {
                            didModifyTX = true;
                        }
                        
                        self._transactions[txid] = transaction;
                        self._spendableBalance = null;
                    }
                    
                    if (self._txCacheValid === false || didModifyTX === true || self._coinType === COIN_BITCOIN || self._coinType === COIN_DASH) {
//                        if (self._coinType === COIN_BITCOIN) {
//                            console.log(self._coinFullName + " ::  updating transaction cache");
//                        }
                        self._txCacheValid = true;

//                        var zip = new thirdparty.zip();
//                        zip.file('txfiles', JSON.stringify(self._transactions));
//                        
//                        var data = zip.generate({base64:true, compression:'DEFLATE'});
//                        console.log("transaction data :: " + JSON.stringify(self._transactions).length + " :: compressed :: " + data.length);
//                        
                        
                       // storeData('wTxCache_' + self._coinFullName + "_" + self._storageKey, JSON.stringify(self._transactions), true);

//                        storeData('wTxCacheCompressed_' + self._coinFullName + "_" + self._storageKey, data, true);
                    } else {
//                        if (self._coinType === COIN_BITCOIN) {
//                            console.log(self._coinFullName + " ::  not updating transaction cache");
//                        }
                    }
                }

                if (message.data.content.currentReceiveAddress) {
                    //                    console.log("pouch :: " + self._coinFullName + " :: update receive address :: " + message.data.content.currentReceiveAddress);
                   //self._currentReceiveAddress = message.data.content.currentReceiveAddress;
                
                    storeData('wCurRecA_' + self._coinFullName + "_" + self._storageKey, self._currentReceiveAddress, true);
                }

                if (message.data.content.currentChangeIndex && message.data.content.currentChangeAddress) {
                    self._currentChangeIndex = message.data.content.currentChangeIndex;
                    self._currentChangeAddress = message.data.content.currentChangeAddress;
                }

                if (message.data.content.smallQrCode) {
                    self._smallQrCode = message.data.content.smallQrCode;
                }

                if (message.data.content.largeQrCode) {
                    self._largeQrCode = message.data.content.largeQrCode;
                }


                if (message.data.content.workerCacheAddressMap) {
//                    console.log("[" + self._coinFullName + "] :: updating worker cache address map");
                    var workerCacheAddressMap = message.data.content.workerCacheAddressMap;
                    
                    var numPrevWorkerCacheKeys = Object.keys(self._w_addressMap).length;
                    var numUpdatedWorkerCacheKeys = Object.keys(workerCacheAddressMap).length;

                    var cacheBalancesUpdated = false;
                    
                    for (var address in workerCacheAddressMap) {
                        var accountInfo = workerCacheAddressMap[address];
                        var existingAccountInfo = self._w_addressMap[address];
                        
                        if (typeof(existingAccountInfo) !== 'undefined' && existingAccountInfo !== null) {
                            if (existingAccountInfo.accountBalance !== accountInfo.accountBalance && (typeof(existingAccountInfo.newSendTx) === 'undefined' || existingAccountInfo.newSendTx === null)) {
                                cacheBalancesUpdated = true;
                            }
                            
                            if (accountInfo.isTheDAOAssociated === true && existingAccountInfo.isTheDAOAssociated !== true) {
                                cacheBalancesUpdate = true;
                            }

                            if (accountInfo.isAugurAssociated === true && existingAccountInfo.isAugurAssociated !== true) {
                                cacheBalancesUpdate = true;
                            }
                        } 
                    }
                    
                    if (self._wkrCacheValid === false || numPrevWorkerCacheKeys < numUpdatedWorkerCacheKeys || cacheBalancesUpdated === true) {
                        self._coinPouchImpl.updateTokenAddresses(workerCacheAddressMap);
                        
                        self._wkrCacheValid = true;

                        storeData('wWrkrCacheAddrMap_' + self._coinFullName + "_" + self._storageKey, JSON.stringify(workerCacheAddressMap), true);
                    } else {
//                        console.log(self._coinFullName + " ::  not updating worker cache");
                    }
                    
                    self._w_addressMap = workerCacheAddressMap;
                    // self.getPouchFoldImplementation().afterWorkerCacheInvalidate();
                }

                self._notify();
            } else if (action === 'finishedFinalBalanceUpdate') {
                console.log(self._coinFullName + " :: finishedFinalBalanceUpdate");
                
                self._hasFinishedFinalBalanceUpdate = true;

                self.getPouchFoldImplementation().processFinishedFinalBalanceUpdate();
            }
        }
   // } catch (err) {

     //   console.error(err);
   // }
    
    if (this._worker) {
        console.log(this._coinFullName + " :: initialize coin worker");
        this._worker.postMessage({
            action: 'initialize',
            coinType: this._coinType,
            testNet: this._TESTNET,
            sourceName: this._coinFullName,
        });
    }
}

HDWalletPouch.prototype.completeWorkerInitialization = function() {
    console.log('completeWorkerInitialization    ',this._worker);
    if (this._worker) {
        var self = this;
        
        var shouldNotify = false;
        
        var shouldPostWorkerCache = false;

        var workerCacheAddressMap = getStoredData('wWrkrCacheAddrMap_' + this._coinFullName + "_" + this._storageKey, true);

      jaxx.Registry.database$.triggerHandler('HDWalletPouch.prototype.completeWorkerInitialization'+this._coinFullName,[this._coinFullName,workerCacheAddressMap]);

   //   console.warn('workerCacheAddressMap   ',workerCacheAddressMap);


        if (workerCacheAddressMap) {
            try {
                workerCacheAddressMap = JSON.parse(workerCacheAddressMap);

                for (var idx in workerCacheAddressMap) {
                    workerCacheAddressMap[idx].newSendTX = null;
                }

                this._w_addressMap = workerCacheAddressMap;

                shouldPostWorkerCache = true;
                
                shouldNotify = true;
            } catch (e) {
                this.log('Invalid cache:', workerCache);
            }
        }

        //        if (this._coinFullName === "Ethereum") {
        //        console.log("_w_addressMap :: " + this._coinFullName + "\n" + JSON.stringify(this._w_addressMap));
        //        }

        if (shouldPostWorkerCache === true) {
            this._worker.postMessage({
                action: 'restoreAddressMapCache',
                content: {
                    workerCacheAddressMap: workerCacheAddressMap
                }
            });
        }

        this._worker.postMessage({
            action: 'triggerExtendedUpdate',
            content: {
                type: 'balances'
            }
        });

//        if (this._coinType === COIN_LISK) {
//            var unneuteredKeys = {
//                action: 'setExtendedPublicKeys',
//                content: {
//                    change: self._changeNode.toBase58(),
//                    receive: self._receiveNode.toBase58()
//                }
//            };
//
//            
//            this._worker.postMessage(unneuteredKeys);
//
//            if (shouldNotify === true) {
//                this._notify();
//            }
//        } else {
            var neuteredKeys = {
                action: 'setExtendedPublicKeys',
                content: {
                    change: self._changeNode.neutered().toBase58(),
                    receive: self._receiveNode.neutered().toBase58()
                }
            };

            this._worker.postMessage(neuteredKeys);

            if (shouldNotify === true) {
                this._notify();
            }
//        }
    }
}

HDWalletPouch.prototype.invalidateTransactionCache = function() {
    this._txCacheValid = false;
}

HDWalletPouch.prototype.invalidateWorkerCache = function() {
    this._wkrCacheValid = false;
}


HDWalletPouch.prototype.shutDown = function() {
    if (this._worker) {
        this._worker.postMessage({
            action: 'shutDown', 
        });
    }
    
    this._coinPouchImpl.shutDown();

    if (this._miningFeeInterval !== null) {
        clearInterval(this._miningFeeInterval);
        this._miningFeeInterval = null;
    }
}

HDWalletPouch.prototype.getRootNodeAddress = function() {
    return HDWalletPouch.getCoinAddress(this._coinType, this._rootNode);
}

HDWalletPouch.prototype.getNode = function(internal, index) {
    if (internal === false) {
        internal = 0;
    } else if (internal === true) {
        internal = 1;
    }
    
    var fromNode = this._receiveNode;
    
    if (internal === 0) {
        fromNode = this._receiveNode;
    } else {
        fromNode = this._changeNode;
    }
    
    return HDWalletPouch._derive(fromNode, index, false);
}

HDWalletPouch.prototype.getDefaultTransactionFee = function() {
    return this._defaultTXFee;
}

HDWalletPouch.prototype.getTransactions = function() {
    var res = this._coinPouchImpl.getTransactions();
    return res;
};

HDWalletPouch.prototype.getHistory = function() {
    var transactions = [];

    ///___________ addded to pull transactions from cryptocontroller

    /*if (this._coinType === COIN_ETHEREUM ||
        this._coinType === COIN_BITCOIN ||
        this._coinType === COIN_DASH ||
        this._coinType === COIN_LITECOIN ||
        this._coinType === COIN_ZCASH ||
        this._coinType === COIN_DOGE) {*/
        
    transactions = this._dataStorageController.getTransactionsFromDB(this._coinType);
   /* } else {
        transactions = this.getTransactions();
    }*/

    if (this._coinType === COIN_DASH) {
//        console.log("getHistory :: num transactions :: " + transactions.length + " :: transactions :: " + JSON.stringify(transactions) + " :: this._cachedHistory.length :: " + this._cachedHistory.length);
    }

    var history = [];
    /*
    if (transactions.length === this._cachedHistory.length) {
        var isIdentical = true;
        
        for (var i = 0; i < transactions.length; i++) {
            if (transactions[i].txid !== this._cachedHistory[i].txid) {
                isIdentical = false;
            }
        }
        
        if (isIdentical) {
            return this._cachedHistory;
        }
    }*/
    
//        if (this._coinType === COIN_BITCOIN) {
//            console.log("not fully cached history");
//        }


    for (var ti = 0; ti < transactions.length; ti++) {
        var transaction = transactions[ti];
        /*
        if (ti < this._cachedHistory.length && transaction.txid === this._cachedHistory[ti].txid) {
            history.push(this._cachedHistory[ti]);
            continue;
        }*/
        
        var newHistoryItem = this._coinPouchImpl.calculateHistoryForTransaction(transaction);

        if (typeof(newHistoryItem) !== 'undefined' && newHistoryItem !== null) {
            history.push(newHistoryItem);
        }
    }

    /*this._cachedHistory = history;*/
    return history;
}

HDWalletPouch.prototype.getPouchFoldBalance = function() {
    var balance = this._coinPouchImpl.getPouchFoldBalance();
    
    return balance;
}










////////////////////////////////////////////////////////!!!!!!!!!!!!!!!!!!!////////////////////////////
//@note: this function when passed in an explicit null to ignoreCached, will use cache.
//@note: cached only in session.
HDWalletPouch.prototype.getPrivateKey = function(internal, index, ignoreCached) {
//  console.log(' getPrivateKey   '+internal +' index   '+ignoreCached)
    if (internal === false) {
        internal = 0;
    } else if (internal === true) {
        internal = 1;
    }

    if (index < 0 || internal < 0) {
        throw new Error('Invalid private key');
    }


    var key = index + '-' + internal;


    //@note: @here: @security: wondering if it might be better not to cache this..
    // @ RESPONSE: YES!!!!! DO NOT CACHE PRIVATE KEYS!
    var privateKey = this._privateKeyCache[key];

 // console.log('HDWalletPouch.prototype.getPrivateKey   '+key);


  var privateKeyChange = HDWalletPouch._derive(this._changeNode, index, false)

  var privateKeyReceive = HDWalletPouch._derive(this._receiveNode, index, false);


// console.log('HDWalletPouch.prototype.   privateKeyChange   '+key,privateKeyChange.keyPair.d.toBuffer(32).toString('hex'))

  //console.log('HDWalletPouch.prototype.   privateKeyReceive   '+key,privateKeyReceive.keyPair.d.toBuffer(32).toString('hex'))



    if (typeof(privateKey) === 'undefined' || privateKey === null || typeof(ignoreCached) !== 'undefined') {
        //@note: use a 'truthy' comparison.
        if (internal == true) {

            privateKey = HDWalletPouch._derive(this._changeNode, index, false).keyPair;
        } else {
            privateKey = HDWalletPouch._derive(this._receiveNode, index, false).keyPair;
        }
        
        if (typeof(ignoreCached) === 'undefined') {
            this._privateKeyCache[key] = privateKey;
        } else {
            console.log("uncached fetch of private key");
        }
    }
    

    return privateKey;
}

//@note: this function returns a checksum address for ethereum. a ".toLowerCase()" on the returned
//variable will be the non-checksummed version.
//@note: this function when passed in an explicit null to ignoreCached, will use cache.
//@note: cached across sessions.

HDWalletPouch.prototype.getPublicAddress = function(internal, index, ignoreCached) {

   // console.log(this._dataStorageController._accountService);
   if(!jaxx.Utils2.getWallet()){
       return '';
   }

   // console.log(typeof (window.wallet));
   // if (typeof(this._dataStorageController) === 'undefined' || this._dataStorageController === null){
      //  return "";
   // }
    /*
//  if (internal === false) {
        internal = 0;
    } else if (internal === true) {
        internal = 1;
    } */
    
    //var key = index + '-' + internal;
    //var publicAddress = this._publicAddressCache[key];
if(isNaN(index)){
    console.error(' index should be a number ' + index);
    return '';
}
   // console.log('internal '+ internal + ' index '+ index)
    var publicAddress = "";
    if (internal){
        publicAddress = this._dataStorageController.getAddressChange(index);    
    } else {
        publicAddress = this._dataStorageController.getAddressRecieve(index);
    }

   // console.log(publicAddress);
    
    /* This is handled by the DCL Layer
    if (typeof(publicAddress) === 'undefined' || publicAddress === null || typeof(ignoreCached) !== 'undefined') {
        //@note: use a 'truthy' comparison.
        if (internal == true) {
            publicAddress = HDWalletPouch.getCoinAddress(this._coinType, HDWalletPouch._derive(this._changeNode, index, false));
        } else {
            publicAddress = HDWalletPouch.getCoinAddress(this._coinType, HDWalletPouch._derive(this._receiveNode, index, false));
        }

        publicAddress = this._coinPouchImpl.toChecksumAddress(publicAddress);
        
        if (typeof(ignoreCached) === 'undefined') {
            this._publicAddressCache[key] = publicAddress;
            
            storeData('wPubAddrCache_' + this._coinFullName + "_" + this._storageKey, JSON.stringify(this._publicAddressCache), true);
        } else {
            console.log("uncached fetch of public address");
        }
    } else {
//        if (this._coinType === COIN_ETHEREUM) {
//            publicAddress = HDWalletHelper.toEthereumChecksumAddress(publicAddress);
////            console.log("cached fetch of public address :: " + publicAddress)
//        }
    }*/
    
    return publicAddress;
}

HDWalletPouch.prototype.getInternalIndexAddressDict = function(publicAddress) {
    var publicAddressKey = this._coinPouchImpl.fromChecksumAddress(publicAddress);

    if (this._coinType === COIN_ETHEREUM || this._coinType === COIN_ETHEREUM_CLASSIC || this._coinType === COIN_TESTNET_ROOTSTOCK) {
        var internalIndexAddress = this._internalIndexAddressCache[publicAddressKey];

        var addToCache = false;

        if (typeof(internalIndexAddress) === 'undefined' || internalIndexAddress === null) {
            addToCache = true;
        } else {
            var arraySplit = internalIndexAddress.split("-");
            internalIndexAddress = {index: arraySplit[0], internal: arraySplit[1]};

            if (arraySplit[0] === '' || arraySplit[1] === '') {
                console.log("bad array found :: " + JSON.stringify(internalIndexAddress) + " :: publicAddressKey :: " + publicAddressKey);
                addToCache = true;
            }
        }

        if (addToCache) {
            var internalIndex = this.getInternalIndexForPublicAddress(publicAddressKey);
            
            if (internalIndex === -1) {
//                console.log("error in describing index for address :: " + publicAddressKey);
                return {index:-1, internal:-1};
            } else {
                internalIndexAddress = "" + internalIndex + "-0";

                this._internalIndexAddressCache[publicAddressKey] = internalIndexAddress;

//                console.log("caching internalIndexAddress :: " + internalIndexAddress + " :: public address :: " + publicAddress)

                storeData('wInternalIndexAddrCache_' + this._coinFullName + "_" + this._storageKey, JSON.stringify(this._internalIndexAddressCache), true);
            }
        } else {
            //        if (this._coinType === COIN_ETHEREUM) {
            //            publicAddress = HDWalletHelper.toEthereumChecksumAddress(publicAddress);
            ////            console.log("cached fetch of public address :: " + publicAddress)
            //        }
        }
    }

    var internalIndexAddress = this._internalIndexAddressCache[publicAddressKey];

    var arraySplit = internalIndexAddress.split("-");
    internalIndexAddress = {index: arraySplit[0], internal: arraySplit[1]};

    return internalIndexAddress;
}
HDWalletPouch.prototype.setShapeShiftDepositAddress = function(address) {
    //This function is only meant to check if shapeshift deposit address is same as previous deposit address
    //WARNING: PLEASE DO NOT USE THIS FUNCTION FOR GETTING ADDRESS. IT IS ONLY MEANT TO CHECK ADDRESS
    // console.error(address);
    this._shapeShiftDepositAddress = address;
}

HDWalletPouch.prototype.getShapeShiftDepositAddress = function() {


    var address = this._shapeShiftDepositAddress;
    //  console.log(address)
    // address = this._coinPouchImpl.toChecksumAddress(address);

    return address;
}
HDWalletPouch.prototype.setCurrentReceiveAddress = function(address) {
 // console.error(address);
    this._currentReceiveAddress = address;
}

HDWalletPouch.prototype.getCurrentReceiveAddress = function() {

    var address = this._dataStorageController.getCurrentPublicAddresReceive();
   // console.warn(address);
    return address;

   // var address = this._currentReceiveAddress;


   // address = this._coinPouchImpl.toChecksumAddress(address);

   // return address;
}
HDWalletPouch.prototype.setCurrentChangeAddress = function(address) {
    this._currentChangeAddress = address;
}
HDWalletPouch.prototype.getCurrentChangeAddress = function() {
    console.warn(this._currentChangeAddress)

    return this._currentChangeAddress;
}

HDWalletPouch.prototype.getCurrentChangeIndex = function() {
    return this._currentChangeIndex;
}

HDWalletPouch.prototype.clearSpendableBalanceCache = function() {
    this._spendableBalance = null;
}

HDWalletPouch.prototype.getSpendableBalance = function(minimumValue) {
    console.log(' HDWalletPouch.prototype.getSpendableBalance    ');

    if (this._spendableBalance !== null && (typeof(minimumValue) === 'undefined' || minimumValue === null)) {
        return this._spendableBalance;
    }
    
    if (typeof(minimumValue) === 'undefined' || minimumValue === null) {
        minimumValue = 0;
    }

    var spendableDict = this._coinPouchImpl.getSpendableBalance(minimumValue);

    var spendableBalance = spendableDict.spendableBalance;
    var numPotentialTX = spendableDict.numPotentialTX;

    if (spendableBalance < 0) {
        spendableBalance = 0;
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
}

HDWalletPouch.prototype.getSpendableAddresses = function(minimumValue) {
    //@note: @here: @todo: implement this for general addresses.
}

//@note: @here: this needs to be populated by getSpendableBalance.
HDWalletPouch.prototype.getShiftsNecessary = function(minimumValue) {
    var spendableBalance = this.getSpendableBalance(minimumValue)
    return this._numShiftsNecessary;
}

HDWalletPouch.prototype.getAccountBalance = function(internal, index, ignoreCached) {
    if (internal === false) {
        internal = 0;
    } else if (internal === true) {
        internal = 1;
    }

    var accountBalance = this._coinPouchImpl.getAccountBalance(internal, index);
    
    return accountBalance;
}

HDWalletPouch.prototype.getHighestReceiveIndex = function() {
    var highestIndexToCheck = -1;
    
    for (var txid in this._transactions) {
        var tx = this._transactions[txid];
        if (!tx.addressInternal && tx.addressIndex > highestIndexToCheck) {
            highestIndexToCheck = tx.addressIndex;
        }
    }
    
    return highestIndexToCheck;
}

HDWalletPouch.prototype.sortHighestAccounts = function() {
    this._sortedHighestAccountArray = [];
    
    var highestIndexToCheck = this.getHighestReceiveIndex();
    
    //@note: @here: @token: this should be refactored eventually.
    if (this._coinType === COIN_ETHEREUM || this._coinType === COIN_ETHEREUM_CLASSIC) {
        highestIndexToCheck++; //@note: @here: check for internal transaction balances on current receive account.
    }
    
    if (highestIndexToCheck !== -1) {
        
        for (var i = 0; i < highestIndexToCheck + 1; i++) {
            var curBalance = this.getAccountBalance(false, i);
            this._sortedHighestAccountArray.push({index: i, balance: curBalance});
        }

        this._sortedHighestAccountArray.sort(function(a, b) {
            if (a.balance > b.balance) {
                return 1;
            } else if (a.balance < b.balance) {
                return -1;
            } else {
                return 0;
            }
        });
        
        this._sortedHighestAccountArray.reverse();
    }
}

HDWalletPouch.prototype.getHighestAccountBalanceAndIndex = function() {
    //@note: @dcl:
    if (this._coinType === COIN_ETHEREUM || this._coinType === COIN_BITCOIN) {
        var cryptoController = g_JaxxApp.getDataStoreController().getCryptoControllerById(COIN_ETHEREUM);
        
        cryptoController.getHighestAccountBalanceAndIndex();
        this._sortedHighestAccountArray = cryptoController._sortedHighestAccountArray;
    } else {
        this.sortHighestAccounts();
    }
    
    return (this._sortedHighestAccountArray) ?this._sortedHighestAccountArray[0] : null;
}

HDWalletPouch.prototype.getInternalIndexForPublicAddress = function(publicAddress) {
    var foundIdx = -1;
    var highestIndexToCheck = this.getHighestReceiveIndex();

    highestIndexToCheck++;
    
    publicAddress = this._coinPouchImpl.fromChecksumAddress(publicAddress);

    for (var i = 0; i < highestIndexToCheck; i++) {
        var addressToCheck = this.getPublicAddress(false, i);
        
        addressToCheck = this._coinPouchImpl.fromChecksumAddress(addressToCheck);

        if (publicAddress === addressToCheck) {
            foundIdx = i;
            break;
        }
    }
    
    if (foundIdx === -1) {
//        console.log("getInternalIndexForPublicAddress :: could not find index of :: " + publicAddress);
    }

    return foundIdx;
}


//@note: cached across sessions.
HDWalletPouch.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {


    var curRecAddr = this.getCurrentReceiveAddress();
    if(this.setCurrentReceiveAddress !== curRecAddr) {
        this.setCurrentReceiveAddress(curRecAddr);
        this._smallQrCode = null;
        this._largeQrCode = null;
        this._qrCodeBase64Cache ={};
    }
   // console.warn(curRecAddr);

    var genQRCode = "";

    if ((typeof(largeFormat) === 'undefined' || largeFormat === null) && (typeof(coinAmountSmallType) === 'undefined' || coinAmountSmallType === null)) {
//        console.log("generating basic qr");

        var key = curRecAddr;
        if(!this._qrCodeBase64Cache)this._qrCodeBase64Cache ={};
        //this._qrCodeBase64Cache ={};

        genQRCode = this._qrCodeBase64Cache[key];

        if (typeof(genQRCode) === 'undefined' || genQRCode === null) {
            genQRCode = this._generateQRCode(largeFormat, coinAmountSmallType);
            
            this._qrCodeBase64Cache[key] = genQRCode;
//            console.log("generating qr :: " + genQRCode);

           // storeData('wQRCodeCache_' + this._coinFullName + "_" + this._storageKey, JSON.stringify(this._qrCodeBase64Cache), true);
        }
    } else {
        genQRCode = this._generateQRCode(largeFormat, coinAmountSmallType);
    }
    
    return genQRCode;
}

HDWalletPouch.prototype._generateQRCode = function(largeFormat,  coinAmountSmallType) {
    return this._coinPouchImpl.generateQRCode(largeFormat, coinAmountSmallType);
}

HDWalletPouch.prototype.setMiningFeeOverride = function(newMiningFeeOverride) {
    this._txFeeOverride = newMiningFeeOverride;
    g_JaxxApp.getSettings().setMiningFeeDefaultForCoin(this._coinType, this._txFeeOverride);
}

HDWalletPouch.prototype.getCurrentMiningFee = function(transactionSizeInBytes) {
    if (typeof(this.getPouchFoldImplementation().getCurrentMiningFee) !== 'undefined'){

        return this.getPouchFoldImplementation().getCurrentMiningFee(transactionSizeInBytes);
    }
    var transactionFee = this._defaultTXFee;


    var miningFee = g_JaxxApp.getSettings().getMiningFeeDefaultForCoin(this._coinType);

   // console.warn(this._coinType +'   '+ miningFee);

    if (miningFee !== 'undefined' && miningFee !== null) {
        transactionFee = miningFee;
    }

    if (this._txFeeOverride >= 0) {
        transactionFee = this._txFeeOverride;
    }

   // console.log("getCurrentMiningFee :: txFeeOverride :: " + this._txFeeOverride + " :: transactionFee :: " + transactionFee);
    return transactionFee;
}

HDWalletPouch.prototype.refresh = function () {
    var cryptoController = this._dataStorageController;
    console.log('  HDWalletPouch.prototype.refresh ');
    //this.$refreshBtn.show();
    //if(this.$controls.hasClass('off'))return;
    //this.$controls.addClass('off');
    //this.$controls.fadeTo('fast',0.5);
    //cryptoController.checkBalanceCurrentReceive();
   // console.error('   HDWalletPouch.prototype.refresh   ');
    jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_MANUAL_START);
    cryptoController.downloadAllBalances(function(err){
        jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_MANUAL_END);
    })
   // console.error('click');
    /*
    if (this._worker) {
        this._worker.postMessage({
            action: 'refresh',
            content: { }
        });
    }*/
}

HDWalletPouch.prototype.getWorker = function(){
    return this._worker;
}

HDWalletPouch.prototype.refreshIfNecessary = function() {
   /* if (this._hasInitRefresh === false) {
        this._hasInitRefresh = true;
        
        // this.refresh();
    }*/
}

HDWalletPouch.prototype.setLogger = function(logger) {
    if (logger && logger.log) {
        this._logger = logger;
    } else {
        this._logger = console;
    }
}

HDWalletPouch.prototype._requestBlockNumber = function(callback) {
    this._coinPouchImpl.requestBlockNumber(callback);
}

HDWalletPouch.prototype.getBlockNumber = function() {
    return this._currentBlock;
}

//Returns a multidimensional array with public address, private key and balance.
HDWalletPouch.prototype.getAccountList = function(){
    //@note: @todo: we might want to sort these..
    var transactions = this.getTransactions(); //Get all transactions




    var result = this._coinPouchImpl.getAccountList(transactions);
//    for (var i = 0; i < 20)
//    result.reverse();

//    var incidences = {};
//    
//    for (var i = 0; i < result.length; i++) {
//        incidences[result[i].pubAddr]++;
//    }
    var uniqueResults = [];

    var processed = {};
    
    for (var i = 0; i < result.length; i++) {
        var isProcessed = (typeof(processed[result[i].pubAddr]) !== 'undefined' && processed[result[i].pubAddr] !== null) ? true : false;

        if (isProcessed) {
        } else {
            uniqueResults.push(result[i]);
        }

        processed[result[i].pubAddr] = true;
    }

    var extremeDebug = false;
    
    if (extremeDebug) {
        if (this._coinType === COIN_ETHEREUM) {
            for (var info in this._w_addressMap) {
                var addressInfo = this._w_addressMap[info];
                if (!addressInfo.internal) {
                    console.log("account balance :: " + this.getPublicAddress(false, addressInfo.index) + " :: " + this.getAccountBalance(false, addressInfo.index));
                }
            }

            this.sortHighestAccounts();
            console.log("_sortedHighestAccountArray :: " + JSON.stringify(this._sortedHighestAccountArray));
        }
        if (this._coinType === COIN_ETHEREUM) {
            results = {};
            //        console.log("[receiveNode] :: " + this._receiveNode.toBase58());
            //        console.log("[receiveNode] chaincode :: " + this._receiveNode.chainCode);

            //@note: @here: transfer paper wallet repro.
//            this._receiveNode.keyPair.compressed = false;
            console.log("[receiveNode] pubKeyBuff :: " + this._receiveNode.keyPair.getPublicKeyBuffer());
//            var manualPvt = this.manuallyDeriveUnhardened(this._receiveNode, 0).keyPair.d.toBuffer(32).toString('hex');

            //        console.log("[receiveNode] manual zeroth :: " + manualPvt);

            for (var i = 0; i < 2; i++) {
                var privateKey = this.getPrivateKey(false, i, true).d.toBuffer(32).toString('hex');

                //            var publicAddress = HDWalletPouch.getLightwalletEthereumAddress(HDWalletPouch._derive(this._receiveNode, i, false));
                var publicAddress = this.getPublicAddress(false, i, true);

                //            console.log("[receive] buffer :: " + HDWalletPouch._derive(this._receiveNode, i, false).toBase58());
                //            console.log("[receive] chaincode :: " + HDWalletPouch._derive(this._receiveNode, i, false).chainCode)
                //            console.log("[receive] derive private key :: " + i + " :: " + HDWalletPouch._derive(this._receiveNode, i, false).keyPair.d.toBuffer(32).toString('hex'));

                console.log("[receive] uncached private key :: " + i + " :: " + privateKey + " :: " + publicAddress);

                //            var privateKey = this.getPrivateKey(false, i, true).d.toBuffer(32).toString('hex');
                //
                //            //            var publicAddress = HDWalletPouch.getLightwalletEthereumAddress(HDWalletPouch._derive(this._receiveNode, i, false));
                //            var publicAddress = this.getPublicAddress(false, i, true);
                //
                //            console.log("[receive] cached private key :: " + i + " :: " + privateKey + " :: " + publicAddress);
                //
                //            var tempPair = [];
                //            tempPair[0] = privateKey;
                //            tempPair[1] = publicAddress;
                //            result.push(tempPair);
            }
        }
    }
    
    
    return uniqueResults;
}

//HDWalletPouch.prototype.getEthereumLegacyStableKeypair = function() {
//    return HDWalletHelper.toEthereumChecksumAddress(this.getPrivateKey(this._coinType, this._receiveNode).toString()) + ", " + this._receiveNode.keyPair.d.toBuffer(32).toString('hex');
//}

/*HDWalletPouch.prototype.log = function() {
    // Convert the argument list to an array
    var args = [].slice.call(arguments);

    if (this._coinType !== -1 && typeof(HDWalletPouch.getStaticCoinPouchImplementation(this._coinType)) !== 'undefined' && HDWalletPouch.getStaticCoinPouchImplementation(this._coinType) !== null) {
        var debugColor = "background: black;"

        var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents['coinDisplayColor'];

        if (typeof(coinDisplayColor) !== 'undefined' && coinDisplayColor !== null) {
            debugColor = "color: " + coinDisplayColor + ";";
        }

        var curLength = args.length;

        args[0] = "%c" + args[0];
        args[args.length] = debugColor;
        //        args.length++;
    }
    
//    if (PlatformUtils.browserChromeCheck()) {
//        var curLength = args.length;
//
//        args[0] = "%c" + args[0];
//        args[args.length] = "color: rgb(102, 153, 255);";//; background: yellow;";
////        args.length++;
//    }
//    
    // Log immediately to our log
   this._logger.log.apply(this._logger, args);
    if (console != this._logger) {
        console.log.apply(console, args);
    }

    // Store for latter for deferred logs
    args.unshift('Deferred:');
    this._log.push(args);

    // Cap the log at 50 entries
    while (this._log.length > 50) {
        this._log.shift();
    }
}*/

HDWalletPouch.prototype.dumpLog = function() {
    // Dump the deferred log set
    for (var i = 0; i < this._log.length; i++) {
        this._logger.log.apply(this._logger, this._log[i]);
    }
}

//@note: not really needed anymore, was used to do a test of derivation functions.
HDWalletPouch.prototype.manuallyDeriveUnhardened = function(fromNode, index) {
//    typeforce(types.UInt32, index)
    var curve = thirdparty.ecurve.getCurveByName('secp256k1');

    var isHardened = index >= thirdparty.bitcoin.HDNode.HIGHEST_BIT
    var data = new thirdparty.Buffer.Buffer(37)

    // Hardened child
    if (isHardened) {
        if (!fromNode.keyPair.d) {
            console.log("error :: A in derivation");
            return null;
        } 

        // data = 0x00 || ser256(kpar) || ser32(index)
        data[0] = 0x00;
        fromNode.keyPair.d.toBuffer(32).copy(data, 1);
        data.writeUInt32BE(index, 33);

        // Normal child
    } else {
        // data = serP(point(kpar)) || ser32(index)
        //      = serP(Kpar) || ser32(index)
        console.log("pubkeybuff :: " + fromNode.keyPair.getPublicKeyBuffer().toString('hex'));
        fromNode.keyPair.getPublicKeyBuffer().copy(data, 0);
        data.writeUInt32BE(index, 33);
    }

    var I = thirdparty.createHmac('sha512', fromNode.chainCode).update(data).digest();
    console.log("createHmac :: I :: " + I);
    var IL = I.slice(0, 32);
    var IR = I.slice(32);

    var pIL = thirdparty.bigi.fromBuffer(IL);

    // In case parse256(IL) >= n, proceed with the next value for i
    if (pIL.compareTo(curve.n) >= 0) {
        console.log("error :: B in derivation");
        return null;
        //return this.derive(index + 1)
    }

    // Private parent key -> private child key
    var derivedKeyPair;
    if (fromNode.keyPair.d) {
        // ki = parse256(IL) + kpar (mod n)
        var ki = pIL.add(fromNode.keyPair.d).mod(curve.n);
        console.log("ki :: " + ki);

        // In case ki == 0, proceed with the next value for i
        if (ki.signum() === 0) {
            console.log("error :: C in derivation");
            return null;
            //return this.derive(index + 1)
        }

        derivedKeyPair = new thirdparty.bitcoin.ECPair(ki, null, {
            network: fromNode.keyPair.network
        })

        // Public parent key -> public child key
    } else {
        // Ki = point(parse256(IL)) + Kpar
        //    = G*IL + Kpar
        var Ki = curve.G.multiply(pIL).add(fromNode.keyPair.Q);

        // In case Ki is the point at infinity, proceed with the next value for i
        if (curve.isInfinity(Ki)) {
            console.log("error :: D in derivation");
            return null;
//            return this.derive(index + 1)
        }

        derivedKeyPair = new thirdparty.bitcoin.ECPair(null, Ki, {
            network: fromNode.keyPair.network
        })
    }

    var hd = new thirdparty.bitcoin.HDNode(derivedKeyPair, IR);
    hd.depth = fromNode.depth + 1;
    hd.index = index;
    hd.parentFingerprint = fromNode.getFingerprint().readUInt32BE(0);

    return hd;
}

HDWalletPouch.prototype.getToken = function(tokenType) {
//    console.log("tokenType :: " + tokenType);
    return this._token[tokenType];
}

HDWalletPouch.prototype.isTokenType = function() {
    return false;
}

HDWalletPouch.prototype.getPouchFoldImplementation = function() {
    return this._coinPouchImpl;
}

HDWalletPouch.prototype.prepareSweepTransaction = function(privateKey, callback) {
    this._coinPouchImpl.prepareSweepTransaction(privateKey, callback);
}

HDWalletPouch.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType){
    return this.getPouchFoldImplementation().convertFiatToCoin(fiatAmount, coinUnitType);
}

HDWalletPouch.prototype.getBaseCoinAddressFormatType = function() {
    //@note: gets the basic format of the addresses. ethereum === ethereum_classic for example.
    return this.getPouchFoldImplementation().getBaseCoinAddressFormatType();
}

HDWalletPouch.prototype.exportKeypairsSynched = function(callback, passthroughParams) {
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
    /*if (this._hasFinishedFinalBalanceUpdate !== true) {
        setTimeout(function() {
          self.exportKeypairsSynched(callback, passthroughParams);
        }, 1000);
    } else {
        var keyPairs = this.getAccountList();
        callback(keyPairs, passthroughParams);
    } */
}

HDWalletPouch.prototype.setDataStorageController = function(ctr) {
    this._dataStorageController = ctr;
}

HDWalletPouch.prototype.setCustomMiningFee = function(fee){
    this._miningFeeDict['customFee'] = fee;
};

HDWalletPouch.prototype.setHasFinishedFinalBalanceUpdate = function(blnHasFinishedFinalBalanceUpdate){
    this._hasFinishedFinalBalanceUpdate = blnHasFinishedFinalBalanceUpdate;
};

HDWalletPouch.prototype.setTransactionData = function(data){
    this.transactionData = data;
};
HDWalletPouch.prototype.getTransactionData = function(){
    return this.transactionData;
};

HDWalletPouch.prototype.setTransactionDataTemp = function(data){
    this.transactionDataTemp = data;
};
HDWalletPouch.prototype.getTransactionDataTemp = function(){
    return this.transactionDataTemp;
};

HDWalletPouch.prototype.getDataStorageController = function(){
    return this._dataStorageController;
}

HDWalletPouch.prototype.getPrivateKeyDisplayBalance = function(balance, noSuffix){
    // @TODO: If this function exists for the pouch implementation then use that instead
    // Prune the balance so that it looks right (Depends on coin type)
    
    // Attach coin abbreviated name unless noSuffix is true
    if (!noSuffix){
        balance = balance + " " + HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents.coinWalletSelector3LetterSymbol;
    }
    return balance;
}

HDWalletPouch.prototype.isToken = function(){
  return this._isTokenFromDCLPerspective;
}

HDWalletPouch.setStoredDeriveData = function(objToHash, newValue){
    // Used for optimization purposes
    //console.log(objToHash);
    var strHash = thirdparty.objectHash.keysMD5(objToHash).toString();
    console.log("Setter hash: "+ strHash);
    if (typeof(HDWalletPouch.storedDeriveData) === 'undefined' || HDWalletPouch.storedDeriveData === null) {
        HDWalletPouch.storedDeriveData = {};
    }
    HDWalletPouch.storedDeriveData[strHash] = newValue;
    // Remove last entry if beyond a certain threshold (ie. 50)
}

HDWalletPouch.getStoredDeriveData = function(objToHash) {
    // Used for optimization purposes
    // console.log(objToHash);
    var strHash = thirdparty.objectHash.keysMD5(objToHash).toString();
    console.log("Getter hash: "+ strHash);
    if (HDWalletPouch.storedDeriveData !== null && typeof(HDWalletPouch.storedDeriveData) !== 'undefined' && typeof(HDWalletPouch.storedDeriveData[strHash]) !== 'undefined' && HDWalletPouch.storedDeriveData[strHash] !== null) {
        return HDWalletPouch.storedDeriveData[strHash]; // Return undefined if the object is not stored
    } else {
        return null;
    }
}

HDWalletPouch.pushStoredDeriveDataToLocalStorage = function(){
    storeData('PouchDerivedData', JSON.stringify(HDWalletPouch.storedDeriveData), true);
}

HDWalletPouch.prototype.increaseNumberOfTransactionsInHistory = function() {
    this._numberOfTransactionsInHistory += 5;
}

HDWalletPouch.prototype.getNumberOfTransactionsInHistory = function(){
    return this._numberOfTransactionsInHistory;
}

HDWalletPouch.prototype.getCurrentOverrideMiningFee = function(){
    // Delegate to pouch if bitcoin
    // Fetch value from settings
    //this.

    if (typeof(this.getPouchFoldImplementation().getCurrentOverrideMiningFee) === 'undefined' || this.getPouchFoldImplementation().getCurrentOverrideMiningFee === null){
        console.log("Ham");
    } else {
        console.log("Bacon");
    }
}

HDWalletPouch.prototype.activateCoinPouchIfInactive = function() {
    if (!this._isCoinPouchActivated){
        this.activateCoinPouch();
        this._isCoinPouchActivated = true;
    }
}

HDWalletPouch.prototype.activateCoinPouch = function() {
    g_JaxxApp.getUI().setupTransactionList(this._coinType);
}

HDWalletPouch.prototype.getPrivateKeyFromAddress = function(address){
    if (typeof(this.getPouchFoldImplementation().getPrivateKeyFromAddress) === 'undefined' || this.getPouchFoldImplementation().getPrivateKeyFromAddress === null){
        return this.getDataStorageController().getKeyPair(address).toWIF();
    } else {
        return this.getPouchFoldImplementation().getPrivateKeyFromAddress(address);
    }
}

HDWalletPouch.prototype.computeTransactionDataBasedOnSendValue = function(){
    // @TODO: Define parameters and delegate to pouch as necessary.
    // If implementation is defined
    if (typeof(this.getPouchFoldImplementation().computeTransactionDataBasedOnSendValue) === 'undefined' || this.getPouchFoldImplementation().computeTransactionDataBasedOnSendValue === null){
        return null;
    } else {
        return this.getPouchFoldImplementation().computeTransactionDataBasedOnSendValue();
    }
}

HDWalletPouch.isValidPrivateKey = function(coinType, value){
    // Consider adding a general pattern here in case the function isn't defined for the target coin type.
    return HDWalletPouch.getStaticCoinPouchImplementation(coinType).isValidPrivateKey(value);
}

HDWalletPouch.prototype.getPrivateKeyCSVList = function(){
    var balanceList = this.getDataStorageController().getBalances();
    var returnList = [];
    for (var i = 0; i < balanceList.length; i++){
        returnList.push({"pvtKey": this.getPrivateKeyFromAddress(balanceList[i].id), "pubAddr": balanceList[i].id, "balance":balanceList[i].balance});
    }
    return returnList;
}

HDWalletPouch.prototype.getIsSendingFullMaxSpendable = function() {
    return this._sendingFullMaxSpendable;
}

HDWalletPouch.prototype.setIsSendingFullMaxSpendable = function(value) {
    this._sendingFullMaxSpendable = value; // ie. true
}

HDWalletPouch.prototype.getNumberOfConfirmationsNecessaryToSuspendCalls = function(){
    if (typeof(this.getPouchFoldImplementation().getNumberOfConfirmationsNecessaryToSuspendCalls) === 'undefined' || this.getPouchFoldImplementation().getNumberOfConfirmationsNecessaryToSuspendCalls === null){
        return this._number_of_confirmations_necessary_to_suspend_calls;
    } else {
        return this.getPouchFoldImplementation().getNumberOfConfirmationsNecessaryToSuspendCalls();
    }
}

HDWalletPouch.prototype.getConfirmationMaxForUI = function(){
    if (typeof(this.getPouchFoldImplementation().getConfirmationMaxForUI) === 'undefined' || this.getPouchFoldImplementation().getConfirmationMaxForUI === null){
        return this._confirmation_max_for_UI;
    } else {
        return this.getPouchFoldImplementation().getConfirmationMaxForUI();
    }
}

HDWalletPouch.prototype.getConfirmationDisplayString = function(confirmations){
    var confirmationString = "";
    if (confirmations === -1){
            confirmationString = "Unconfirmed";
    } else if (confirmations === 0){
            confirmationString = "Unconfirmed";
    } else if (confirmations === 1){
            confirmationString = "1 Confirmation";
    } else if (confirmations < this.getConfirmationMaxForUI()) {
            confirmationString = confirmations + " Confirmations";
    } else {
        confirmationString = "Confirmed";
    }
    return confirmationString;
}

HDWalletPouch.prototype.getConfirmationDisplayStringForNumberOfConfirmations = function(confirmations){
    var returnValue = "";
    if (confirmations < this.getConfirmationMaxForUI()) {
        returnValue = confirmations.toString();
    } else {
        returnValue = "+" + this.getConfirmationMaxForUI().toString();
    }
    return returnValue;    
}

HDWalletPouch.prototype.getMaxSpendableCachedAmount = function(){
    return this._maxSpendableCachedAmount;
}

HDWalletPouch.prototype.setMaxSpendableCachedAmount = function(newValue){
    this._maxSpendableCachedAmount = newValue;
}