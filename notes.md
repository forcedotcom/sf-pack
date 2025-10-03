# Update packages
* remove packages: rm -rf node_modules
* delete yarn.lock
* yarn install

* manual update: yarn upgrade-interactive --latest

# Tests
* yarn test:cover

# readme
* yarn readme


# Error
(node:7328) [MissingMessageError] Warning: MissingMessageError
module: @oclif/core@4.2.2
task: findCommand (api:file)
plugin: @salesforce/sf-pack
root: C:\development\node\sf-pack
code: MissingMessageError
message: Missing message sf-pack:recordsFlagDescription for locale en_US.

# Solution: 
yarn build
