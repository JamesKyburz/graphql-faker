#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("core-js/shim");
var graphql_1 = require("graphql");
var fs = require("fs");
var path = require("path");
var express = require("express");
var graphqlHTTP = require("express-graphql");
var chalk = require("chalk");
var opn = require("opn");
var cors = require("cors");
var bodyParser = require("body-parser");
var lodash_1 = require("lodash");
var yargs = require("yargs");
var fake_schema_1 = require("./fake_schema");
var proxy_1 = require("./proxy");
var utils_1 = require("./utils");
var DEFAULT_PORT = process.env.PORT || 9002;
var argv = yargs
    .usage('Usage: $0 [file]')
    .alias('p', 'port')
    .nargs('p', 1)
    .describe('p', 'HTTP Port')
    .default('p', DEFAULT_PORT)
    .alias('e', 'extend')
    .nargs('e', 1)
    .describe('e', 'URL to existing GraphQL server to extend')
    .alias('o', 'open')
    .describe('o', 'Open page with IDL editor and GraphiQL in browser')
    .alias('H', 'header')
    .describe('H', 'Specify headers to the proxied server in cURL format,' +
    'e.g.: "Authorization: bearer XXXXXXXXX"')
    .nargs('H', 1)
    .implies('header', 'extend')
    .describe('forward-headers', 'Headers that should be forwarded to the proxied server')
    .array('forward-headers')
    .implies('forward-headers', 'extend')
    .alias('co', 'cors-origin')
    .nargs('co', 1)
    .describe('co', 'CORS: Define Access-Control-Allow-Origin header')
    .help('h')
    .alias('h', 'help')
    .epilog("Examples:\n\n  # Mock GraphQL API based on example IDL and open interactive editor\n  $0 --open\n\n  # Extend real data from SWAPI with faked data based on extension IDL\n  $0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/\n\n  # Extend real data from GitHub API with faked data based on extension IDL\n  $0 ./ext-gh.graphql --extend https://api.github.com/graphql \\\n  --header \"Authorization: bearer <TOKEN>\"")
    .argv;
var log = console.log;
var headers = {};
if (argv.header) {
    var headerStrings = Array.isArray(argv.header) ? argv.header : [argv.header];
    for (var _i = 0, headerStrings_1 = headerStrings; _i < headerStrings_1.length; _i++) {
        var str = headerStrings_1[_i];
        var index = str.indexOf(':');
        var name = str.substr(0, index);
        var value = str.substr(index + 1).trim();
        headers[name] = value;
    }
}
var forwardHeaderNames = (argv.forwardHeaders || []).map(function (str) { return str.toLowerCase(); });
var fileArg = argv._[0];
var fileName = fileArg || (argv.extend ?
    './schema_extension.faker.graphql' :
    './schema.faker.graphql');
var fakeDefinitionAST = readAST(path.join(__dirname, 'fake_definition.graphql'));
var corsOptions = {};
if (argv.co) {
    corsOptions['origin'] = argv.co;
    corsOptions['credentials'] = true;
}
var userIDL;
if (utils_1.existsSync(fileName)) {
    userIDL = readIDL(fileName);
}
else {
    // different default IDLs for extend and non-extend modes
    var defaultFileName = argv.e ? 'default-extend.graphql' : 'default-schema.graphql';
    userIDL = readIDL(path.join(__dirname, defaultFileName));
}
function readIDL(filepath) {
    return new graphql_1.Source(fs.readFileSync(filepath, 'utf-8'), filepath);
}
function readAST(filepath) {
    return graphql_1.parse(readIDL(filepath));
}
function saveIDL(idl) {
    fs.writeFileSync(fileName, idl);
    log(chalk.green('✚') + " schema saved to " + chalk.magenta(fileName) + " on " + (new Date()).toLocaleString());
    return new graphql_1.Source(idl, fileName);
}
if (argv.e) {
    // run in proxy mode
    var url_1 = argv.e;
    proxy_1.proxyMiddleware(url_1, headers)
        .then(function (_a) {
        var schemaIDL = _a[0], cb = _a[1];
        schemaIDL = new graphql_1.Source(schemaIDL, "Inrospection from \"" + url_1 + "\"");
        runServer(schemaIDL, userIDL, cb);
    })
        .catch(function (error) {
        log(chalk.red(error.stack));
        process.exit(1);
    });
}
else {
    runServer(userIDL, null, function (schema) {
        fake_schema_1.fakeSchema(schema);
        return { schema: schema };
    });
}
function buildServerSchema(idl) {
    var ast = graphql_1.concatAST([graphql_1.parse(idl), fakeDefinitionAST]);
    return graphql_1.buildASTSchema(ast);
}
function runServer(schemaIDL, extensionIDL, optionsCB) {
    var app = express();
    if (extensionIDL) {
        var schema = buildServerSchema(schemaIDL);
        extensionIDL.body = extensionIDL.body.replace('<RootTypeName>', schema.getQueryType().name);
    }
    app.options('/graphql', cors(corsOptions));
    app.use('/graphql', cors(corsOptions), graphqlHTTP(function (req) {
        var schema = buildServerSchema(schemaIDL);
        var forwardHeaders = lodash_1.pick(req.headers, forwardHeaderNames);
        return __assign({}, optionsCB(schema, extensionIDL, forwardHeaders), { graphiql: true });
    }));
    app.get('/user-idl', function (_, res) {
        res.status(200).json({
            schemaIDL: schemaIDL.body,
            extensionIDL: extensionIDL && extensionIDL.body,
        });
    });
    app.use('/user-idl', bodyParser.text());
    app.post('/user-idl', function (req, res) {
        try {
            if (extensionIDL === null)
                schemaIDL = saveIDL(req.body);
            else
                extensionIDL = saveIDL(req.body);
            res.status(200).send('ok');
        }
        catch (err) {
            res.status(500).send(err.message);
        }
    });
    app.use('/editor', express.static(path.join(__dirname, 'editor')));
    var server = app.listen(argv.port);
    var shutdown = function () {
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    log("\n" + chalk.green('✔') + " Your GraphQL Fake API is ready to use \uD83D\uDE80\n  Here are your links:\n\n  " + chalk.blue('❯') + " Interactive Editor:\t http://localhost:" + argv.port + "/editor\n  " + chalk.blue('❯') + " GraphQL API:\t http://localhost:" + argv.port + "/graphql\n\n  ");
    if (!fileArg) {
        log(chalk.yellow("Default file " + chalk.magenta(fileName) + " is used. " +
            "Specify [file] parameter to change."));
    }
    if (argv.open) {
        setTimeout(function () { return opn("http://localhost:" + argv.port + "/editor"); }, 500);
    }
}
//# sourceMappingURL=index.js.map