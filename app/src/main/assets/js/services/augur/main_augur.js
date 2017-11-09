/**
 * Created by Daniel on 2017-01-11.
 */
var jaxx;
(function (jaxx) {
    var CryptoAugurEthereum = (function () {
        function CryptoAugurEthereum(coinType, coin_HD_index, service) {
            this.coinType = coinType;
            this.coin_HD_index = coin_HD_index;
            this.service = service;
            this._coinType = -1;
            this.i = 0;
            this.gasPrice = 2e10;
            this.gasLimitDefault = 150000;
            this.attempts = 10;
            this.speed = 200;
            this.apiKey = '';
            this.nullCount = 0;
            this.generator = null;
            this._coinType = coinType;
            var options = {
                urlBalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{address}}&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX',
                urlTransactions: 'http://api.etherscan.io/api?module=account&action=txlist&address={{address}}',
                urlTransactionStatus: 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
                urlTransactionInternal: 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
                apiKey: '',
                hd_index: coin_HD_index,
                name: service.name
            };
            this.options = options;
            this.init();
        }
        CryptoAugurEthereum.prototype.initialize = function () {
        };
        CryptoAugurEthereum.prototype.init = function () {
            this.gasLimit = this.gasLimitDefault;
            this.generator = new jaxx.GeneratorBlockchain(this.service.name, COIN_ETHEREUM, this.coin_HD_index);
            this.name = this.service.name;
        };
        CryptoAugurEthereum.prototype.sendTransaction2 = function (transaction) {
            var ctr = new jaxx.SendTransaction(this.name, this.gasPrice, this.gasLimit);
            return ctr.sendTransaction(transaction);
        };
        // web3.eth.getTransaction(transactionHash [, callback])
        CryptoAugurEthereum.prototype.checkTransactionByAddress = function (txid, address) {
            var url = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                // console.warn(address, txid, res);
                var trransactions = jaxx.ServiceMappers.mapEtherTransactions(res.result, address);
                //  console.log(trransactions);
                return trransactions.filter(function (o) { return o.id === txid; });
            });
        };
        CryptoAugurEthereum.prototype.getTransactionStatus = function (transactionId) {
            var url = this.options.urlTransactionStatus.replace('{{transaction_id}}', transactionId);
            return $.getJSON(url).then(function (res) {
                /*
                 from this.urlTransactionStatus1
                 * {
                 status: "1",
                 message: "OK",
                 result: {
                 isError: "0",
                 errDescription: ""
                 }
                 }

                 *
                 * */
                var out = new VOTransactionStatus({
                    txid: transactionId,
                    status: Number(res.status),
                });
                if (Number(res.result.isError)) {
                    out.error = res.result.errDescription;
                }
                else
                    out.success = true;
                return out;
            });
        };
        /* checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction[]>{
         var req:CheckTransactionEthereum = new CheckTransactionEthereum();
         return req.checkTransaction(trs,this.apiKey);
         }*/
        //  addressesChange:string[];
        // addressesReceive:string[];
        CryptoAugurEthereum.prototype.restoreHistory = function (receive_change) {
            return null;
        };
        CryptoAugurEthereum.prototype.sendTransactinsStart = function (transaction) {
            var ctr = new jaxx.SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        };
        /*  sendBuiltTransactions(builtTransactions:VOBuiltTransaction[]):JQueryDeferred<VOBuiltTransaction[]>{
         var req:RequestSendTransactionEther = new RequestSendTransactionEther(this.service);
         return req.sendBuiltTransactions(builtTransactions);
         }
         */
        ////////////////////////////// Transactions //////
        CryptoAugurEthereum.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            var req = new jaxx.DownloadTransactionsEthereum(this.name);
            req.downloadTransactions(addresses).done(function (res) {
                //console.log(res)
                var out = res.map(function (item) {
                    return new VOTransactionUnspent(item);
                });
                deferred.resolve({ result: [], utxos: out });
            }).fail(function (err) { return deferred.fail(err); });
            return deferred;
        };
        CryptoAugurEthereum.prototype.downloadTransactions = function (addresses) {
            var req = new jaxx.DownloadTransactionsBlockchain(this.name, this.options);
            req.parse = function (result, address) {
                return jaxx.ServiceMappers.mapEtherTransactions(result.result, address);
            };
            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            this.downloadingTransaction = req;
            return req.downloadTransactions(addresses);
        };
        CryptoAugurEthereum.prototype.downloadTransactions2 = function (voaddresses) {
            return null;
        };
        CryptoAugurEthereum.prototype.downloadTransactionsForAddress = function (address) {
            var url = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                var result = res.result;
                return jaxx.ServiceMappers.mapEtherTransactions(result, address);
            });
        };
        CryptoAugurEthereum.prototype.setTransactionEventEmiter = function (emitter$) {
            var sendTransaction = new jaxx.EthereumSendTransaction();
            sendTransaction.setTransactionEventEmiter(emitter$);
        };
        //////////////////////////////////////// Balances /////////////////////
        CryptoAugurEthereum.prototype.downloadBalances = function (addresses) {
            var d = $.Deferred();
            var address = addresses[0];
            var url = this.options.urlBalance.replace('{{address}}', address);
            // console.log(url);
            $.get(url).done(function (res) {
                //  console.log(res);
                d.resolve([new VOBalance({
                        id: address,
                        balance: +res.result
                    })]);
            });
            // var req:BalancesAugur = new BalancesAugur();
            // return req.loadBalances(addresses);//.done(res=>d.resolve(res)).fail(err=>d.reject(err));
            return d;
        };
        CryptoAugurEthereum.prototype.checkBalanceForAddress = function (address) {
            var url = this.options.urlBalance.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                //console.warn(res);
                return new VOBalance({
                    id: address,
                    balance: +res.result,
                    timestamp: Date.now()
                });
            });
        };
        CryptoAugurEthereum.prototype.getMiningPrice = function () {
            return this.gasPrice;
        };
        CryptoAugurEthereum.prototype.getMiningFees = function () {
            return this.gasPrice * this.gasLimit;
        };
        CryptoAugurEthereum.prototype.getMiningFeeLimit = function () {
            return this.gasLimit;
        };
        CryptoAugurEthereum.RECEIVE = 'receive';
        CryptoAugurEthereum.CHANGE = 'change';
        return CryptoAugurEthereum;
    }());
    jaxx.CryptoAugurEthereum = CryptoAugurEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main_augur.js.map