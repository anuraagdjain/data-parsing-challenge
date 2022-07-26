# Problem Description

We have supplied you with a small web server called fixture. It is written in Python, we offer two versions:

- fixture_2 will run with Python 2.6 or Python 2.7, while
- fixture_3 will run with Python 3.6 or newer.

Pretty much any Unix based system will work (e.g. Linux or a Mac.) You can probably even use a Windows if you want, but the verification tool may not work.

By default the web server listens on port 7299.

The web server has three endpoints:

- /source/a
  - emits JSON records.
- /source/b
  - emits XML records.
- /sink/a
  - accepts JSON records.

Most records from Source A will have a corresponding record from Source B, these are "joined" records.

Some records from one source will not have a match from the other source, these are "orphaned" records.

Some records are malformed, these are "defective" records.

Each source will emit each record ID either 0 or 1 times.

Your program must read all the records from `/source/a` and `/source/b`, categorize them as "joined", "orphaned", or "defective".

It must report the "joined' and "orphaned" records to `/sink/a`, It can ignore defective records, the ordering in which records are submitted is not important.

By default the test program will emit around 1000 records, once all the records have been read from an endpoint it responds with a "done" message.

You must start sending data before the endpoints are done.

In testing we will run your program against a much larger data set, so your program must behave as if it is going to run forever.

**Here's the catch**: Both sources and the sink endpoints are interlinked. Sometimes an endpoint will block until data has been read from or written to the other endpoints, when this happens the request will return a 406 response. The program will never deadlock.

# The Solution

The solution is provided in TypeScript with steps to execute the code.

### Pre-requisites:

1. [nvm](https://github.com/nvm-sh/nvm)
2. [Node.js](https://nodejs.org/en/)
3. The python server is already running on port `7299`.

### How to run the code?

1. Clone this repo and `cd` into the `src` folder.
2. Run `nvm use` or ensure you're on Nodejs v16
3. Run `npm i` to install the dependencies
4. `npm run start:dev` will run the code with hot-reloading via nodemon.
5. To run the unit tests do `npm run test:unit` command.

## Explanation

[![](https://mermaid.ink/img/pako:eNp9kDEOgzAMRa8SeS4XYKgEogeo6EY6WIkpqJDQkAwIcfeaAFJZmuHH-Xr2lzODspoghZfDoRGPQhrBZ9PRBqcoq8p4i-z5a-eHne_2J1Cg6r7qAbbmzd2ssfc0VCSJqMmrRmj0yK_rNuAU8R-K5YqMZLQYcOos6gjF4BWCC_Tkemw1rzivjgTfUE8SUi411Rg6L0GahdEwcAzddOutg7TGbqQLYPC2nIyC1LtAB1S0yD_W79TyBbRzak8)](https://mermaid.live/edit#pako:eNp9kDEOgzAMRa8SeS4XYKgEogeo6EY6WIkpqJDQkAwIcfeaAFJZmuHH-Xr2lzODspoghZfDoRGPQhrBZ9PRBqcoq8p4i-z5a-eHne_2J1Cg6r7qAbbmzd2ssfc0VCSJqMmrRmj0yK_rNuAU8R-K5YqMZLQYcOos6gjF4BWCC_Tkemw1rzivjgTfUE8SUi411Rg6L0GahdEwcAzddOutg7TGbqQLYPC2nIyC1LtAB1S0yD_W79TyBbRzak8)

Queue service constantly fetches data from both the sources in parallel and persists in it's cache as `orphaned` if there's no match of the record from the other source.
If the data exist in it's cache, then it pushes that data to `sink A` with `kind='joined'`. All three operations are happening in parallel so that sink A doesn't have to wait
until all the data from source A & B have been processed. This gives us a real-time processor as both sources can produce data endlessly.

When running with larger dataset (> 25000), it was observed that the python server would end abruptly without waiting for 15seconds. This causes few orphaned data to not be sent to sinkA.  
Assuming that there's an issue in sink A and If this service failed to send the payload to `sink A` three times (can be configurable), then that payload can be dropped or we can have a dead letter queue, which will try to process this again or record this payload in the database and notify the administrator to check and retry the records. This ensures we don't discard data.

I have used the `Map` object to cache the data received from sources, this prevents us from running multiple copies of the code as this cache cannot be shared between services. To enable that, we could use ElastiCache and that will add some latency as we will then be performing operations over the network.
The service first starts sending `joined` data and it processes all the `orphaned` data at the end because, I have given preference to sending accurate data and not sending `orphaned` first and then later updating the record as `joined`. Also, I have chosen to delete the records as they're `joined` to ensure we constantly clean up storage in the service.
