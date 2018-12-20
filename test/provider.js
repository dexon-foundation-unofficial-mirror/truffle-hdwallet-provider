const Ganache = require('@dexon-foundation/ganache-core');
const assert = require('assert');
const WalletProvider = require('../index.js');
const EthUtil = require('ethereumjs-util');

describe("HD Wallet Provider", function(done) {
  const Web3 = require('web3');
  const web3 = new Web3();
  const port = 8545;
  let server;
  let provider;

  before(done => {
    server = Ganache.server();
    server.listen(port, done);
  });

  after(done => {
    setTimeout(() => server.close(done), 100);
  });

  afterEach(() => {
    web3.setProvider(null);
    provider.engine.stop();
  });

  it('provides for a mnemonic', function(done){
    const truffleDevAccounts = [
      "0x852dcb4fc2abac2e5d1e641fb0cc61f3d0017491",
      "0x0b1e1d60249144a13e7c1da3a21ebe84b07975ed",
      "0xb57a0f13f3ecce715818f78aab1e11cd6935e43e",
      "0x005f3c64df1405c2d7a2be10ee9e7dca85fc525e",
      "0x6008b748473dc0e050d5de8edd348f74fe974d3f",
      "0xaff3a39f8c6480717fb77726cbfffe3235894273",
      "0x2e30cdd294b6451884a54eb8080d5936bcfe316d",
      "0xf56215c1adda35f947ce871343e2be40cf3de63f",
      "0xfc8ce10b93f1b7a374ddc0161d336abb87034100",
      "0x481921c27af48ab3102291bd9af06678ef4dc2d6"
    ];

    const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
    provider = new WalletProvider(mnemonic, `http://localhost:${port}`, 0, 10);

    assert.deepEqual(provider.getAddresses(), truffleDevAccounts);
    web3.setProvider(provider);

    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });

  it("throws on invalid mnemonic", function (done) {
    try {
      provider = new WalletProvider("takoyaki is delicious", "http://localhost:8545", 0, 1);
      assert.fail("Should throw on invalid mnemonic");
    } catch(e) {
      assert.equal(e.message, "Mnemonic invalid or undefined");
      done();
    }
  });

  it('provides for a private key', function(done){
    const privateKey = '3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580'; //random valid private key generated with ethkey
    provider = new WalletProvider(privateKey, `http://localhost:${port}`);
    web3.setProvider(provider);

    const addresses = provider.getAddresses();
    assert.equal(addresses[0], '0xc515db5834d8f110eee96c3036854dbf1d87de2b');
    addresses.forEach((address) => {
      assert(EthUtil.isValidAddress(address), 'invalid address');
    });


    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });

  it('provides for an array of private keys', function(done){
    const privateKeys = [
      '3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580',
      '9549f39decea7b7504e15572b2c6a72766df0281cea22bd1a3bc87166b1ca290',
    ];

    const privateKeysByAddress = {
      '0xc515db5834d8f110eee96c3036854dbf1d87de2b': '3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580',
      '0xbd3366a0e5d2fb52691e3e08fabe136b0d4e5929': '9549f39decea7b7504e15572b2c6a72766df0281cea22bd1a3bc87166b1ca290',
    };


    provider = new WalletProvider(privateKeys, `http://localhost:${port}`, 0, privateKeys.length); //pass in num_addresses to load full array
    web3.setProvider(provider);

    const addresses = provider.getAddresses();
    assert.equal(addresses.length, privateKeys.length, 'incorrect number of wallets derived');
    addresses.forEach((address) => {
      assert(EthUtil.isValidAddress(address), 'invalid address');
      const privateKey = new Buffer(privateKeysByAddress[address], 'hex');
      const expectedAddress = `0x${EthUtil.privateToAddress(privateKey).toString('hex')}`;
      assert.equal(address, expectedAddress, 'incorrect address for private key');
    });


    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });
});

