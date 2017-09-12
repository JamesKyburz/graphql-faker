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
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var set = require('lodash/set');
var graphql_1 = require("graphql");
var fake_schema_1 = require("./fake_schema");
function proxyMiddleware(url, headers) {
    var remoteServer = requestFactory(url, headers);
    return getIntrospection().then(function (introspection) {
        var introspectionSchema = graphql_1.buildClientSchema(introspection.data);
        var introspectionIDL = graphql_1.printSchema(introspectionSchema);
        return [introspectionIDL, function (serverSchema, extensionIDL, forwardHeaders) {
                var extensionAST = graphql_1.parse(extensionIDL);
                var extensionFields = getExtensionFields(extensionAST);
                var schema = graphql_1.extendSchema(serverSchema, extensionAST);
                fake_schema_1.fakeSchema(schema);
                //TODO: proxy extensions
                return {
                    schema: schema,
                    rootValue: function (info) {
                        var operationName = info.operationName;
                        var variables = info.variables;
                        var query = stripQuery(schema, info.document, operationName, extensionFields);
                        return remoteServer(query, variables, operationName, forwardHeaders)
                            .then(buildRootValue);
                    },
                };
            }];
    });
    function getIntrospection() {
        return remoteServer(graphql_1.introspectionQuery)
            .then(function (introspection) {
            if (introspection.errors)
                throw Error(JSON.stringify(introspection.errors, null, 2));
            return introspection;
        })
            .catch(function (error) {
            throw Error("Can't get introspection from " + url + ":\n" + error.message);
        });
    }
}
exports.proxyMiddleware = proxyMiddleware;
function buildRootValue(response) {
    var rootValue = response.data;
    var globalErrors = [];
    for (var _i = 0, _a = (response.errors || []); _i < _a.length; _i++) {
        var error = _a[_i];
        if (!error.path)
            globalErrors.push(error);
        // Recreate root value up to a place where original error was thrown
        // and place error as field value.
        set(rootValue, error.path, new Error(error.message));
    }
    // TODO proxy global errors
    if (globalErrors.length !== 0)
        console.error('Global Errors:\n', globalErrors);
    return rootValue;
}
function getExtensionFields(extensionAST) {
    var extensionFields = {};
    (extensionAST.definitions || []).forEach(function (def) {
        if (def.kind !== graphql_1.Kind.TYPE_EXTENSION_DEFINITION)
            return;
        var typeName = def.definition.name.value;
        // FIXME: handle multiple extends of the same type
        extensionFields[typeName] = def.definition.fields.map(function (field) { return field.name.value; });
    });
    return extensionFields;
}
function injectTypename(node) {
    return __assign({}, node, { selections: node.selections.concat([
            {
                kind: graphql_1.Kind.FIELD,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: '__typename',
                },
            },
        ]) });
}
function stripQuery(schema, queryAST, operationName, extensionFields) {
    var typeInfo = new graphql_1.TypeInfo(schema);
    var changedAST = graphql_1.visit(queryAST, graphql_1.visitWithTypeInfo(typeInfo, (_a = {},
        _a[graphql_1.Kind.FIELD] = function () {
            var typeName = typeInfo.getParentType().name;
            var fieldName = typeInfo.getFieldDef().name;
            if (fieldName.startsWith('__'))
                return null;
            if ((extensionFields[typeName] || []).includes(fieldName))
                return null;
        },
        _a[graphql_1.Kind.SELECTION_SET] = {
            leave: function (node) {
                var type = typeInfo.getParentType();
                if (graphql_1.isAbstractType(type) || node.selections.length === 0)
                    return injectTypename(node);
            }
        },
        _a)));
    var operation = extractOperation(changedAST, operationName);
    operation = removeUnusedVariables(operation);
    return graphql_1.print(operation);
    var _a;
}
function removeUnusedVariables(queryAST) {
    var seenVariables = {};
    graphql_1.visit(queryAST, (_a = {},
        _a[graphql_1.Kind.VARIABLE_DEFINITION] = function () { return false; },
        _a[graphql_1.Kind.VARIABLE] = function (node) {
            seenVariables[node.name.value] = true;
        },
        _a));
    // Need to second visit to account for variables used in fragments
    // so we make modification only when we seen all variables.
    return graphql_1.visit(queryAST, (_b = {},
        _b[graphql_1.Kind.OPERATION_DEFINITION] = {
            leave: function (node) {
                var variableDefinitions = node.variableDefinitions.filter(function (def) { return seenVariables[def.variable.name.value]; });
                return __assign({}, node, { variableDefinitions: variableDefinitions });
            },
        },
        _b));
    var _a, _b;
}
function extractOperation(queryAST, operationName) {
    var operations = graphql_1.separateOperations(queryAST);
    if (operationName)
        return operations[operationName];
    return Object.values(operations)[0];
}
function requestFactory(url, headersObj) {
    return function (query, variables, operationName, forwardHeaders) {
        return node_fetch_1.default(url, {
            method: 'POST',
            headers: new node_fetch_2.Headers(__assign({ "content-type": 'application/json' }, headersObj, forwardHeaders)),
            body: JSON.stringify({
                operationName: operationName,
                query: query,
                variables: variables,
            })
        }).then(function (responce) {
            if (responce.ok)
                return responce.json();
            return responce.text().then(function (body) {
                throw Error(responce.status + " " + responce.statusText + "\n" + body);
            });
        });
    };
}
//# sourceMappingURL=proxy.js.map