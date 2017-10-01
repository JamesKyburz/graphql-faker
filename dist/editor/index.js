"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./css/app.css");
require("./css/codemirror.css");
require("./editor/editor.css");
require("graphiql/graphiql.css");
var classNames = require("classnames");
var GraphiQL = require("graphiql");
var graphql_1 = require("graphql");
var fetch = require("isomorphic-fetch");
var fakeIDL = require("raw-loader!../fake_definition.graphql");
var React = require("react");
var ReactDOM = require("react-dom");
var GraphQLEditor_1 = require("./editor/GraphQLEditor");
var icons_1 = require("./icons");
var FakeEditor = /** @class */ (function (_super) {
    __extends(FakeEditor, _super);
    function FakeEditor(props) {
        var _this = _super.call(this, props) || this;
        _this.saveUserIDL = function () {
            var _a = _this.state, value = _a.value, dirty = _a.dirty;
            if (!dirty)
                return;
            if (!_this.updateIdl(value))
                return;
            _this.postIDL(value).then(function (res) {
                if (res.ok) {
                    _this.setStatus('Saved!', 2000);
                    return _this.setState(function (prevState) { return (__assign({}, prevState, { cachedValue: value, dirty: false, error: null })); });
                }
                else {
                    res.text().then(function (errorMessage) {
                        return _this.setState(function (prevState) { return (__assign({}, prevState, { error: errorMessage })); });
                    });
                }
            });
        };
        _this.onEdit = function (val) {
            if (_this.state.error)
                _this.updateIdl(val);
            _this.setState(function (prevState) { return (__assign({}, prevState, { value: val, dirty: val !== _this.state.cachedValue })); });
        };
        _this.state = {
            value: null,
            cachedValue: null,
            activeTab: 0,
            dirty: false,
            error: null,
            status: null,
            schema: undefined,
        };
        return _this;
    }
    FakeEditor.prototype.componentDidMount = function () {
        var _this = this;
        this.fetcher('/user-idl')
            .then(function (response) { return response.json(); })
            .then(function (idls) {
            _this.updateValue(idls);
        });
        window.onbeforeunload = function () {
            if (_this.state.dirty)
                return 'You have unsaved changes. Exit?';
        };
    };
    FakeEditor.prototype.fetcher = function (url, options) {
        if (options === void 0) { options = {}; }
        var _a = window.location, protocol = _a.protocol, host = _a.host;
        var baseUrl = protocol + "//" + host;
        return fetch(baseUrl + url, __assign({ credentials: 'include' }, options));
    };
    FakeEditor.prototype.graphQLFetcher = function (graphQLParams) {
        return this.fetcher('/graphql', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(graphQLParams),
        }).then(function (response) { return response.json(); });
    };
    FakeEditor.prototype.updateValue = function (_a) {
        var schemaIDL = _a.schemaIDL, extensionIDL = _a.extensionIDL;
        var value = extensionIDL || schemaIDL;
        this.proxiedSchemaIDL = extensionIDL ? schemaIDL : null;
        this.setState({
            value: value,
            cachedValue: value,
            extendMode: !!extensionIDL,
        });
        this.updateIdl(value, true);
    };
    FakeEditor.prototype.postIDL = function (idl) {
        return this.fetcher('/user-idl', {
            method: 'post',
            headers: { 'Content-Type': 'text/plain' },
            body: idl,
        });
    };
    FakeEditor.prototype.updateIdl = function (value, noError) {
        if (noError === void 0) { noError = false; }
        var extensionIDL;
        var schemaIDL;
        if (this.state.extendMode) {
            extensionIDL = value;
            schemaIDL = this.proxiedSchemaIDL;
        }
        else {
            schemaIDL = value;
        }
        var fullIdl = schemaIDL + '\n' + fakeIDL;
        try {
            var schema_1 = graphql_1.buildSchema(fullIdl);
            if (extensionIDL)
                schema_1 = graphql_1.extendSchema(schema_1, graphql_1.parse(extensionIDL));
            this.setState(function (prevState) { return (__assign({}, prevState, { schema: schema_1, error: null })); });
            return true;
        }
        catch (e) {
            if (noError)
                return;
            this.setState(function (prevState) { return (__assign({}, prevState, { error: e.message })); });
            return false;
        }
    };
    FakeEditor.prototype.setStatus = function (status, delay) {
        var _this = this;
        this.setState(function (prevState) { return (__assign({}, prevState, { status: status })); });
        if (!delay)
            return;
        setTimeout(function () {
            _this.setState(function (prevState) { return (__assign({}, prevState, { status: null })); });
        }, delay);
    };
    FakeEditor.prototype.switchTab = function (tab) {
        this.setState(function (prevState) { return (__assign({}, prevState, { activeTab: tab })); });
    };
    FakeEditor.prototype.render = function () {
        var _this = this;
        var _a = this.state, value = _a.value, activeTab = _a.activeTab, dirty = _a.dirty, extendMode = _a.extendMode;
        var prefixIDL = fakeIDL + (this.proxiedSchemaIDL || '');
        return (React.createElement("div", { className: "faker-editor-container" },
            React.createElement("nav", null,
                React.createElement("div", { className: "logo" },
                    React.createElement("a", { href: "https://github.com/APIs-guru/graphql-faker", target: "_blank" },
                        ' ',
                        React.createElement("img", { src: "./logo.svg" }),
                        ' ')),
                React.createElement("ul", null,
                    React.createElement("li", { onClick: function () { return _this.switchTab(0); }, className: classNames({
                            '-active': activeTab === 0,
                            '-dirty': dirty,
                        }) },
                        ' ',
                        React.createElement(icons_1.EditIcon, null),
                        ' '),
                    React.createElement("li", { onClick: function () { return _this.state.schema && _this.switchTab(1); }, className: classNames({
                            '-disabled': !this.state.schema,
                            '-active': activeTab === 1,
                        }) },
                        ' ',
                        React.createElement(icons_1.ConsoleIcon, null),
                        ' '),
                    React.createElement("li", { className: "-pulldown -link" },
                        React.createElement("a", { href: "https://github.com/APIs-guru/graphql-faker", target: "_blank" },
                            ' ',
                            React.createElement(icons_1.GithubIcon, null),
                            ' ')))),
            React.createElement("div", { className: "tabs-container" },
                React.createElement("div", { className: classNames('tab-content', 'editor-container', {
                        '-active': activeTab === 0,
                    }) },
                    React.createElement(GraphQLEditor_1.default, { schemaPrefix: prefixIDL, extendMode: !!extendMode, onEdit: this.onEdit, onCommand: this.saveUserIDL, value: value || '' }),
                    React.createElement("div", { className: "action-panel" },
                        React.createElement("a", { className: classNames("material-button", {
                                '-disabled': !dirty,
                            }), onClick: this.saveUserIDL },
                            React.createElement("span", null, " Save ")),
                        React.createElement("div", { className: "status-bar" },
                            React.createElement("span", { className: "status" },
                                " ",
                                this.state.status,
                                " "),
                            React.createElement("span", { className: "error-message" }, this.state.error)))),
                React.createElement("div", { className: classNames('tab-content', {
                        '-active': activeTab === 1,
                    }) }, this.state.schema && (React.createElement(GraphiQL, { fetcher: function (e) { return _this.graphQLFetcher(e); }, schema: this.state.schema }))))));
    };
    return FakeEditor;
}(React.Component));
ReactDOM.render(React.createElement(FakeEditor, null), document.getElementById('container'));
//# sourceMappingURL=index.js.map