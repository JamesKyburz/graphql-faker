"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import * as faker from 'faker';
var faker = require('faker');
function getRandomInt(min, max) {
    return faker.random.number({ min: min, max: max });
}
exports.getRandomInt = getRandomInt;
function getRandomItem(array) {
    return array[getRandomInt(0, array.length - 1)];
}
exports.getRandomItem = getRandomItem;
exports.typeFakers = {
    'Int': {
        defaultOptions: { min: 0, max: 99999 },
        generator: function (options) {
            options.precision = 1;
            return function () { return faker.random.number(options); };
        }
    },
    'Float': {
        defaultOptions: { min: 0, max: 99999, precision: 0.01 },
        generator: function (options) {
            return function () { return faker.random.number(options); };
        }
    },
    'String': {
        defaultOptions: {},
        generator: function () {
            return function () { return 'string'; };
        }
    },
    'Boolean': {
        defaultOptions: {},
        generator: function () {
            return function () { return faker.random.boolean(); };
        }
    },
    'ID': {
        defaultOptions: {},
        generator: function () {
            return function () {
                return new Buffer(faker.random.number({ max: 9999999999 }).toString()).toString('base64');
            };
        }
    },
};
var fakeFunctions = {
    //TODO: add format arg
    zipCode: function () { return faker.address.zipCode(); },
    city: function () { return faker.address.city(); },
    streetName: function () { return faker.address.streetName(); },
    streetAddress: {
        args: ['useFullAddress'],
        func: function (useFullAddress) { return faker.address.streetAddress(useFullAddress); },
    },
    county: function () { return faker.address.county(); },
    country: function () { return faker.address.country(); },
    countryCode: function () { return faker.address.countryCode(); },
    state: function () { return faker.address.state(); },
    stateAbbr: function () { return faker.address.stateAbbr(); },
    latitude: function () { return faker.address.latitude(); },
    longitude: function () { return faker.address.longitude(); },
    colorName: function () { return faker.commerce.color(); },
    productCategory: function () { return faker.commerce.department(); },
    productName: function () { return faker.commerce.productName(); },
    money: {
        //TODO: add 'dec' and 'symbol'
        args: ['minMoney', 'maxMoney'],
        func: function (min, max) { return faker.commerce.price(min, max); },
    },
    productMaterial: function () { return faker.commerce.productMaterial(); },
    product: function () { return faker.commerce.product(); },
    companyName: function () { return faker.company.companyName(); },
    companyCatchPhrase: function () { return faker.company.catchPhrase(); },
    companyBS: function () { return faker.company.bs(); },
    dbColumn: function () { return faker.database.column(); },
    dbType: function () { return faker.database.type(); },
    dbCollation: function () { return faker.database.collation(); },
    dbEngine: function () { return faker.database.engine(); },
    pastDate: function () { return faker.date.past(); },
    futureDate: function () { return faker.date.future(); },
    recentDate: function () { return faker.date.recent(); },
    financeAccountName: function () { return faker.finance.accountName(); },
    //TODO: investigate finance.mask
    financeTransactionType: function () { return faker.finance.transactionType(); },
    currencyCode: function () { return faker.finance.currencyCode(); },
    currencyName: function () { return faker.finance.currencyName(); },
    currencySymbol: function () { return faker.finance.currencySymbol(); },
    bitcoinAddress: function () { return faker.finance.bitcoinAddress(); },
    internationalBankAccountNumber: function () { return faker.finance.iban(); },
    bankIdentifierCode: function () { return faker.finance.bic(); },
    hackerAbbr: function () { return faker.hacker.itAbbr(); },
    hackerPhrase: function () { return faker.hacker.phrase(); },
    imageUrl: {
        args: ['imageHeight', 'imageWidth', 'imageCategory', 'randomizeImageUrl'],
        func: function (height, width, category, randomize) {
            return faker.image.imageUrl(height, width, category, randomize, false);
        },
    },
    avatarUrl: function () { return faker.internet.avatar(); },
    email: {
        args: ['emailProvider'],
        func: function (provider) { return faker.internet.email(undefined, undefined, provider); },
    },
    url: function () { return faker.internet.url(); },
    domainName: function () { return faker.internet.domainName(); },
    ipv4Address: function () { return faker.internet.ip(); },
    ipv6Address: function () { return faker.internet.ipv6(); },
    userAgent: function () { return faker.internet.userAgent(); },
    colorHex: function () { return faker.internet.color(); },
    macAddress: function () { return faker.internet.mac(); },
    password: {
        args: ['passwordLenth'],
        func: function (len) { return faker.internet.password(len); },
    },
    lorem: {
        args: ['loremSize'],
        func: function (size) { return faker.lorem[size || 'paragraphs'](); },
    },
    firstName: function () { return faker.name.firstName(); },
    lastName: function () { return faker.name.lastName(); },
    fullName: function () { return faker.name.findName(); },
    jobTitle: function () { return faker.name.jobTitle(); },
    //FIXME: phone number
    uuid: function () { return faker.random.uuid(); },
    word: function () { return faker.random.word(); },
    words: function () { return faker.random.words(); },
    locale: function () { return faker.random.locale(); },
    filename: function () { return faker.system.commonFileName(); },
    mimeType: function () { return faker.system.mimeType(); },
    fileExtension: function () { return faker.system.fileExt(); },
    semver: function () { return faker.system.semver(); },
};
Object.keys(fakeFunctions).forEach(function (key) {
    var value = fakeFunctions[key];
    if (typeof fakeFunctions[key] === 'function')
        fakeFunctions[key] = { args: [], func: value };
});
function fakeValue(type, options, locale) {
    var fakeGenerator = fakeFunctions[type];
    var argNames = fakeGenerator.args;
    //TODO: add check
    var callArgs = argNames.map(function (name) { return options[name]; });
    var localeBackup = faker.locale;
    //faker.setLocale(locale || localeBackup);
    faker.locale = locale || localeBackup;
    var result = fakeGenerator.func.apply(fakeGenerator, callArgs);
    //faker.setLocale(localeBackup);
    faker.locale = localeBackup;
    return result;
}
exports.fakeValue = fakeValue;
//# sourceMappingURL=fake.js.map