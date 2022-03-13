# Disclaimer

This project was put on pause. The fact that Bitcoin doesn't have a clear protocol—and that Bitcoin Code is the de facto protocol—means this project would have to replicate all the features, and all the bugs, of Bitcoin Core. I'm not interested in that but I'll keep this repo here for historical purposes. Also, it's quite educational to read the tests (at least I think so).

# Bitcoin.js

Highly experimental implementation of a Bitcoin Full Node on JavaScript.

[Other projects](https://github.com/bitcoinjs/bitcoinjs-lib) are not bitcoin nodes but only clients, and only provide utilities like creating an address or getting information from a full node through RPC. This project however aims at implementing the full bitcoin protocol, including block verification and mining.

## Milestones

### v1 (current, WIP)

The first milestone is to implement Bitcoin from first principles. This includes:

- [x] Chain of blocks ("blockchain")
- [x] Mining / PoW
- [ ] Difficulty adjustment
- [ ] Network and peering

> During the development of v1 this project will be open-source but closed to contributions (i.e. not accepting PRs at this moment).

### v2 (future)

The end goal for this project is to be compatible with the mainnet bitcoin network.

# Installing dependencies

```
npm install
```

# Running tests

```
npm test
```

# Author

This project is being built by Oliver Offing, you can [follow him on Twitter for updates](https://twitter.com/OliverOffing).
