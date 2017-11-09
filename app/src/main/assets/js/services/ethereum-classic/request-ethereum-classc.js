/**
 * Created by Vlad on 10/21/2016.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var jaxx;
(function (jaxx) {
    var CryptoEthereumClassic = (function (_super) {
        __extends(CryptoEthereumClassic, _super);
        /* options:any ={
             hooks:{
                 'coinfabrik':{
                     nonce:{
                         url:'http://api.jaxx.io:8080/api/eth/nextNonce?address={{address}}',
                         parser:'parseUTXOsCoinfabrikLTC'
                     }
                 }
             }
   
         }*/
        function CryptoEthereumClassic(coinType, coin_HD_index, service, options) {
            _super.call(this, coinType, coin_HD_index, service, options);
            this.coinType = coinType;
            this.coin_HD_index = coin_HD_index;
            this.service = service;
        }
        CryptoEthereumClassic.prototype.init = function () {
            this.generator = new jaxx.GeneratorBlockchain(this.service.name, this._coinType, this.coin_HD_index);
            this.name = this.service.name;
            //this.options.urlBalance ='https://api.etherscan.io/api?module=account&action=balance&address={{address}}&tag=latest';
            //options.urlTransactionStatus = 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';
            // options.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';
            // this.options.urlTransactions = 'https://etcchain.com/api/v1/getTransactionsByAddress?&address={{address}}';
            this.options.urlTransactions = 'http://api.jaxx.io:8080/api/eth/mergedTransactions?addresses={{address}}'; //&limit=20&only_from=false&only_to=false&direction=descending';
            // this.options.urlTransactions2 = 'http://api.jaxx.io:8080/api/eth/mergedTransactions?addresses={{addresses}}';
            this.options.urlBalance = 'http://api.jaxx.io:8080/api/eth/balance?addresses={{addresses}}';
            this.options.apiKey = '';
            //this.urlTransactionStatus= 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';
            //this.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';
        };
        CryptoEthereumClassic.prototype._downloadTransactionsUnspent = function (addresses, onSuccess, onError) {
        };
        CryptoEthereumClassic.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            console.warn(addresses);
            return deferred;
        };
        CryptoEthereumClassic.prototype.restoreHistory = function (receive_change) {
            // console.log(this.options);
            var req = new jaxx.RestoreEthereum(this.options, this.generator);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            return req.restoreHistory(receive_change).done(function (res) {
                // console.log(receive_change + ' done ',res);
                return res;
            });
        };
        CryptoEthereumClassic.prototype.downloadTransactions = function (addresses) {
            /*let promise:JQueryDeferred<VOTransaction[]> = $.Deferred();
    
            let url:string = this.options.urlTransactions2.replace('{{addresses}}', addresses.toString());
            console.log(' downloadTransactions    ' + url);
    
            $.getJSON(url).done(function (res) {
                console.log(res);
    
            }).fail(function (er) {
                promise.reject(er);
            });*/
            var req = new jaxx.DownloadTransactionsBlockchain(this.name, this.options);
            req.url = this.options.urlTransactions;
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            return req.downloadTransactions(addresses);
            // var req:DownloadTransactionsEthereum = new DownloadTransactionsEthereum(this.name);
            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            // this.downloadingTransaction = req;
            // return promise
        };
        CryptoEthereumClassic.prototype.downloadBalances = function (addresses) {
            // var d:JQueryDeferred<VOBalance[]> = $.Deferred();
            //    console.log(' downloadBalances   ' + addresses.toString());
            var req = new jaxx.BalancesEthereum(this.options);
            req.parse = function (res) {
                // console.log(res);
                var stamp = Math.round(Date.now() / 1000);
                var out = [];
                for (var str in res) {
                    out.push(new VOBalance({
                        id: str,
                        balance: +res[str],
                        timestamp: stamp
                    }));
                }
                return out;
            };
            return req.loadBalances(addresses); //.done(res=>d.resolve(res)).fail(err=>d.reject(err));
            // return d;
        };
        return CryptoEthereumClassic;
    }(jaxx.CryptoEthereum));
    jaxx.CryptoEthereumClassic = CryptoEthereumClassic;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=request-ethereum-classc.js.map