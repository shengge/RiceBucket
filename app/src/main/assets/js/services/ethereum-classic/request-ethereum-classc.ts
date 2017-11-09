/**
 * Created by Vlad on 10/21/2016.
 */

module jaxx{
  export class CryptoEthereumClassic extends CryptoEthereum {

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

    constructor(public coinType:number, public coin_HD_index:number, public service:JaxxAccountService, options?:any){
        super(coinType,coin_HD_index,service, options);
    }

    init(){
        this.generator = new GeneratorBlockchain(this.service.name, this._coinType, this.coin_HD_index);

        this.name = this.service.name;
        //this.options.urlBalance ='https://api.etherscan.io/api?module=account&action=balance&address={{address}}&tag=latest';

        //options.urlTransactionStatus = 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';
       // options.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';

       // this.options.urlTransactions = 'https://etcchain.com/api/v1/getTransactionsByAddress?&address={{address}}';
        this.options.urlTransactions = 'http://api.jaxx.io:8080/api/eth/mergedTransactions?addresses={{address}}';//&limit=20&only_from=false&only_to=false&direction=descending';

       // this.options.urlTransactions2 = 'http://api.jaxx.io:8080/api/eth/mergedTransactions?addresses={{addresses}}';
        this.options.urlBalance = 'http://api.jaxx.io:8080/api/eth/balance?addresses={{addresses}}';
        this.options.apiKey ='';

        //this.urlTransactionStatus= 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';

        //this.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';

    }

      _downloadTransactionsUnspent(addresses:string[], onSuccess:Function, onError:Function):void{



      }

      downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}>{
          let deferred:JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> = $.Deferred();

          console.warn(addresses);


          return deferred


      }

      restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[], transactions:VOTransaction[]}>{

          // console.log(this.options);
          var req:RestoreEthereum = new RestoreEthereum(this.options, this.generator);
          req.parse = function (result: any, address) {

             // console.log(result);
              let ar:any[] = result.transactions;

              return ServiceMappers.mapEtherTransactions(ar,address);

          }
          return req.restoreHistory(receive_change).done((res)=>{
              // console.log(receive_change + ' done ',res);
              return res
          });
      }


      downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]>{


        /*let promise:JQueryDeferred<VOTransaction[]> = $.Deferred();

        let url:string = this.options.urlTransactions2.replace('{{addresses}}', addresses.toString());
        console.log(' downloadTransactions    ' + url);

        $.getJSON(url).done(function (res) {
            console.log(res);

        }).fail(function (er) {
            promise.reject(er);
        });*/


          let req:DownloadTransactionsBlockchain= new DownloadTransactionsBlockchain(this.name, this.options);
          req.url = this.options.urlTransactions;
          req.parse = function (result: any, address:string) {
             // console.log(result);
              let ar:any[] = result.transactions;
              return ServiceMappers.mapEtherTransactions(ar,address);
          }
          return req.downloadTransactions(addresses);




         // var req:DownloadTransactionsEthereum = new DownloadTransactionsEthereum(this.name);
          /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
         // this.downloadingTransaction = req;
         // return promise
      }

      downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]>{
          // var d:JQueryDeferred<VOBalance[]> = $.Deferred();
        //    console.log(' downloadBalances   ' + addresses.toString());
          var req:BalancesEthereum = new BalancesEthereum(this.options);
          req.parse = function(res){
            // console.log(res);
              let stamp:number = Math.round(Date.now()/1000);

              let out:any[] = [];
              for (let str in res){
                  out.push(new VOBalance({
                      id:str,
                      balance:+res[str],
                      timestamp:stamp
                  }))
              }
              return out;
          }

          return req.loadBalances(addresses);//.done(res=>d.resolve(res)).fail(err=>d.reject(err));
          // return d;
      }

  }
}