/**
 * Created by Daniel on 2017-01-11.
 */

///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>

module jaxx {
  export class BalancesAugur implements IMobileRequest {

    onDestroyed: Function;
    destroyed: boolean;
    _currentBatch: number = 20;
    _name: string = "";
    apikey;
    deferred: JQueryDeferred<VOBalance[]>
    errors: number;
    addresses: string[][];
    results: VOBalance[];
    request: JQueryXHR;
    requests: JQueryXHR[];
    url: string;
    maxErrors: number = 20;
    requestsDelay: number = 20;
    onHold: boolean;
    progress: number;

    //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
    _relayManager: any = null;

    //@note: @here: for gathering transactions in a batch.
    _batchSize: number = 20;

    _enableLog: boolean = true;

    log(params): void {
      if (this._enableLog) {
        console.log("[ Balances " + this._name + " ] :: " + params);
      }
    }

    constructor() {
      this.init();
    }

    initialize(name: string, relayManager: any): void {
      // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address=0x25040290d7Ed172C74A0CcAE37E09B413C26155B&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX
      // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{addresses}}&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
      this.url = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{address}}&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';

      this.apikey = '';
      this.url += this.apikey;
    }

    init(): void {
      // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address=0x25040290d7Ed172C74A0CcAE37E09B413C26155B&tag=latest
      this.url = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{address}}&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
      this.apikey = '';
      this.url += this.apikey;
    }

    abort(): IMobileRequest {
      return this;
    }

    wait() {
      this.onHold = true;
    }

    resume() {
      this.onHold = false;
      this.getNextBalances();
    }

    reset(): void {
      this.results = [];
      this.errors = 0;
      this._currentBatch = -1;
    }

    destroy(): void {
      if (this.request) {
        this.request.abort();
        this.request = null;
      }
      this.deferred = null;
      this.results = [];
      this.destroyed = true;
      if (this.onDestroyed) this.onDestroyed();
    }

    onError(id: number, message: string): void {
      this.errors++;
      if (this.errors > this.maxErrors) {
        this.deferred.reject({
          error: id,
          message: message
        });
        this.destroy();
        return;
      }
      this._currentBatch--;
      setTimeout(() => this.getNextBalances(), 10000);
    }

    parse(resp: any, address: string): VOBalance {
      console.log(address);
      return new VOBalance({id: address, balance: Number(resp.result), timestamp: Date.now()});
      // if (resp && resp.result) {
      //   var t: number = Date.now();
      //   return resp.result.map(function (item) {
          //return new VOBalance({id: item.account, balance: Number(item.balance), timestamp: t});
          ///return new VOBalance({id:item.account,balance:+item.balance/Math.pow(10,20),timestamp:t})
        //})

      //}
      // this.onError(' no-data ');
      // return null;
    }

    loadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {

      this.reset();

      this.addresses = Utils.splitInCunks(addresses, this._batchSize);

      this.deferred = $.Deferred();

      this.getNextBalances();
      return this.deferred;
    }

    onSuccess(): void {
      this.deferred.resolve(this.results);
      setTimeout(() => this.destroy(), 10);
    }

    getNextBalances(): void {
      this._currentBatch++;
      if (this._currentBatch >= this.addresses.length) {
        this.onSuccess();
        return;
      }

      var addresses: string[] = this.addresses[this._currentBatch];

      for (var i = 0; i < addresses.length; i++) {
        this.getNextBalancesHelper(addresses[i]);
      }
      /*
      var url = this.url.replace('{{address}}', addresses.toString());
      this.request = <JQueryXHR>$.getJSON(url);
      this.request.then(res => this.parse(res)).done(res => {
        this.request = null;
        // console.log(res);
        if (res) {
          this.results = this.results.concat(res);
          setTimeout(() => this.getNextBalances(), this.requestsDelay);
        } else  this.onError(1245, url + ' result ' + res.toString());

      }).fail(err => this.onError(1404, err.toString()));*/
    }

    getNextBalancesHelper(address): void {
      var url = this.url.replace('{{address}}', address.toString());
      console.log(url);
      this.request = <JQueryXHR>$.getJSON(url);
      this.request.then(res => this.parse(res, address)).done(res => {
        // res.id = address;
        this.request = null;
        // console.log(res);
        if (res) {
          this.results = this.results.concat(res);
          setTimeout(() => this.getNextBalances(), this.requestsDelay);
        } else  this.onError(1245, url + ' result ' + res.toString());

      }).fail(err => this.onError(1404, err.toString()));
    }
  }
}